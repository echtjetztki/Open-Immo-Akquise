import { NextResponse } from 'next/server';
import { sendSecurityWebhook, type WebhookTarget } from '@/lib/security-webhook';
import { blockDemoWrites, requireSessionUser } from '@/lib/access';

const parseTarget = (value: unknown): WebhookTarget => {
    const normalized = (value ?? '').toString().trim().toLowerCase();
    if (normalized === 'live' || normalized === 'both') {
        return normalized;
    }
    return 'test';
};

export async function POST(request: Request) {
    const access = await requireSessionUser(['admin']);
    if (!access.ok) {
        return access.response;
    }

    const demoWriteBlock = blockDemoWrites();
    if (demoWriteBlock) {
        return demoWriteBlock;
    }

    const adminUser = access.user;

    let body: { target?: string } = {};
    try {
        body = await request.json();
    } catch {
        body = {};
    }

    const target = parseTarget(body?.target);

    const payload = {
        event: 'webhook_test' as const,
        reason: target === 'live' ? 'manual_admin_live_test' : target === 'both' ? 'manual_admin_live_and_test' : 'manual_admin_test',
        username: adminUser.username || 'admin',
        displayName: adminUser.displayName || 'Administrator',
        role: adminUser.role || 'admin',
        source: 'api/settings/test-security-webhook',
        metadata: {
            triggeredBy: 'admin_settings_button',
            triggeredAt: new Date().toISOString(),
            target
        }
    };

    const traceId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `trace-${Date.now()}`;

    const delivery = await sendSecurityWebhook(request, payload, { target });

    const success = target === 'both'
        ? delivery.live === true && delivery.test === true
        : target === 'live'
            ? delivery.live === true
            : delivery.test === true;

    const message = target === 'both'
        ? 'Live + Test Webhook gesendet'
        : target === 'live'
            ? 'Live Webhook einmal getestet'
            : 'Test-Webhook wurde gesendet';

    const logs = [delivery.details.live, delivery.details.test]
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .map((entry) => ({
            target: entry.label,
            method: entry.method,
            ok: entry.ok,
            status: entry.status,
            statusText: entry.statusText || '',
            durationMs: entry.durationMs,
            url: entry.url,
            error: entry.error || '',
            responseText: entry.responseText || '',
            fallbackUsed: entry.fallbackUsed || false,
            initialPostStatus: entry.initialPostStatus ?? null,
            initialPostError: entry.initialPostError || '',
            timestamp: entry.timestamp,
        }));

    const failedLog = logs.find((entry) => !entry.ok);
    const error = failedLog
        ? [
            `Target ${failedLog.target}`,
            failedLog.status ? `HTTP ${failedLog.status}` : null,
            failedLog.error || null,
        ].filter(Boolean).join(' | ')
        : undefined;

    return NextResponse.json({
        success,
        message,
        error,
        traceId,
        target,
        delivery: {
            live: delivery.live,
            test: delivery.test,
        },
        logs,
        payload
    });
}
