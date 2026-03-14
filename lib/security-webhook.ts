const LIVE_SECURITY_WEBHOOK_URL =
    (process.env.SECURITY_WEBHOOK_URL || process.env.NEXT_PUBLIC_SECURITY_WEBHOOK_URL || '').trim();

const TEST_SECURITY_WEBHOOK_URL =
    (process.env.SECURITY_WEBHOOK_TEST_URL || process.env.NEXT_PUBLIC_SECURITY_WEBHOOK_TEST_URL || '').trim();

export type SecurityEventType =
    | 'login_success'
    | 'login_failed'
    | 'password_change_success'
    | 'password_change_failed'
    | 'webhook_test';

export type WebhookTarget = 'live' | 'test' | 'both';

type SecurityWebhookPayload = {
    event: SecurityEventType;
    reason?: string;
    username?: string;
    displayName?: string;
    role?: string;
    mode?: string;
    targetAgent?: string;
    source?: string;
    error?: string;
    metadata?: Record<string, unknown>;
};

type SecurityWebhookOptions = {
    target?: WebhookTarget;
    timeoutMs?: number;
};

export type SecurityWebhookDeliveryDetail = {
    label: 'live' | 'test';
    url: string;
    method: 'POST' | 'GET';
    ok: boolean;
    status: number | null;
    statusText?: string;
    responseText?: string;
    error?: string;
    fallbackUsed?: boolean;
    initialPostStatus?: number | null;
    initialPostError?: string;
    durationMs: number;
    timestamp: string;
};

export type SecurityWebhookResult = {
    live: boolean | null;
    test: boolean | null;
    details: {
        live: SecurityWebhookDeliveryDetail | null;
        test: SecurityWebhookDeliveryDetail | null;
    };
};

const getClientIp = (request: Request) => {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || '';
};

const getN8nAlternateWebhookUrl = (inputUrl: string): string | null => {
    try {
        const parsed = new URL(inputUrl);
        if (parsed.pathname.includes('/webhook-test/')) {
            parsed.pathname = parsed.pathname.replace('/webhook-test/', '/webhook/');
            return parsed.toString();
        }
        if (parsed.pathname.includes('/webhook/')) {
            parsed.pathname = parsed.pathname.replace('/webhook/', '/webhook-test/');
            return parsed.toString();
        }
    } catch {
        return null;
    }
    return null;
};

async function sendToWebhook(
    url: string,
    label: 'live' | 'test',
    body: Record<string, unknown>,
    timeoutMs: number
): Promise<SecurityWebhookDeliveryDetail> {
    const startedAt = Date.now();
    const timestamp = new Date().toISOString();

    if (!url) {
        return {
            label,
            url,
            method: 'POST',
            ok: false,
            status: null,
            error: 'Webhook URL ist nicht gesetzt',
            durationMs: Date.now() - startedAt,
            timestamp,
        };
    }

    const runRequest = async (
        method: 'POST' | 'GET',
        requestUrl: string
    ): Promise<SecurityWebhookDeliveryDetail> => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(requestUrl, {
                method,
                headers: method === 'POST'
                    ? {
                        'Content-Type': 'application/json',
                    }
                    : undefined,
                body: method === 'POST' ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            const durationMs = Date.now() - startedAt;

            if (!response.ok) {
                const responseText = await response.text();
                console.error(`Security webhook (${label}) failed (${method}):`, response.status, responseText.slice(0, 500));
                return {
                    label,
                    url: requestUrl,
                    method,
                    ok: false,
                    status: response.status,
                    statusText: response.statusText,
                    responseText: responseText.slice(0, 1000),
                    error: `HTTP ${response.status}`,
                    durationMs,
                    timestamp,
                };
            }

            return {
                label,
                url: requestUrl,
                method,
                ok: true,
                status: response.status,
                statusText: response.statusText,
                durationMs,
                timestamp,
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown webhook error';
            console.error(`Security webhook (${label}) error (${method}):`, message);
            return {
                label,
                url: requestUrl,
                method,
                ok: false,
                status: null,
                error: message,
                durationMs: Date.now() - startedAt,
                timestamp,
            };
        } finally {
            clearTimeout(timeout);
        }
    };

    const postResult = await runRequest('POST', url);
    if (postResult.ok) {
        return postResult;
    }

    const responseTextLower = (postResult.responseText || '').toLowerCase();
    const alternateUrl = getN8nAlternateWebhookUrl(url);
    const shouldRetryAlternateWebhook =
        Boolean(alternateUrl) &&
        (postResult.status === 404 ||
            postResult.status === 405 ||
            responseTextLower.includes('not registered for post') ||
            responseTextLower.includes('did you mean to make a get request'));

    if (shouldRetryAlternateWebhook && alternateUrl) {
        const alternatePostResult = await runRequest('POST', alternateUrl);
        if (alternatePostResult.ok) {
            return {
                ...alternatePostResult,
                fallbackUsed: true,
                initialPostStatus: postResult.status,
                initialPostError: postResult.error,
            };
        }
    }

    const shouldRetryAsGet =
        postResult.status === 404 &&
        (
            responseTextLower.includes('not registered for post') ||
            responseTextLower.includes('did you mean to make a get request')
        );

    if (!shouldRetryAsGet) {
        return postResult;
    }

    const getUrl = new URL(url);
    for (const [key, value] of Object.entries(body)) {
        if (value === undefined || value === null) {
            continue;
        }
        if (typeof value === 'object') {
            getUrl.searchParams.set(key, JSON.stringify(value));
        } else {
            getUrl.searchParams.set(key, String(value));
        }
    }

    const getResult = await runRequest('GET', getUrl.toString());
    return {
        ...getResult,
        fallbackUsed: true,
        initialPostStatus: postResult.status,
        initialPostError: postResult.error,
    };
}

export async function sendSecurityWebhook(
    request: Request,
    payload: SecurityWebhookPayload,
    options: SecurityWebhookOptions = {}
): Promise<SecurityWebhookResult> {
    const target = options.target
        || (
            LIVE_SECURITY_WEBHOOK_URL && TEST_SECURITY_WEBHOOK_URL
                ? 'both'
                : LIVE_SECURITY_WEBHOOK_URL
                    ? 'live'
                    : TEST_SECURITY_WEBHOOK_URL
                        ? 'test'
                        : 'live'
        );
    const timeoutMs = options.timeoutMs ?? 2000;

    const body = {
        timestamp: new Date().toISOString(),
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') || '',
        ...payload
    };

    const result: SecurityWebhookResult = {
        live: null,
        test: null,
        details: {
            live: null,
            test: null,
        },
    };

    if (target === 'live' || target === 'both') {
        const liveResult = await sendToWebhook(LIVE_SECURITY_WEBHOOK_URL, 'live', body, timeoutMs);
        result.live = liveResult.ok;
        result.details.live = liveResult;
    }

    if (target === 'test' || target === 'both') {
        const testResult = await sendToWebhook(TEST_SECURITY_WEBHOOK_URL, 'test', body, timeoutMs);
        result.test = testResult.ok;
        result.details.test = testResult;
    }

    return result;
}
