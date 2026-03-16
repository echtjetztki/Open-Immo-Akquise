const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SESSION_VERSION = 1;

export type SessionRole = 'admin' | 'user' | 'agent';

export type SessionPayload = {
    userId?: number;
    username?: string;
    displayName?: string;
    role?: SessionRole;
};

type SignedSessionEnvelope = {
    v: number;
    p: string;
    s: string;
};

const normalizeBase64Url = (value: string) => value.replace(/-/g, '+').replace(/_/g, '/');

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
    const copy = new Uint8Array(bytes.length);
    copy.set(bytes);
    return copy.buffer;
};

const toBase64Url = (bytes: Uint8Array) => {
    let base64: string;
    if (typeof Buffer !== 'undefined') {
        base64 = Buffer.from(bytes).toString('base64');
    } else {
        let binary = '';
        for (const b of bytes) binary += String.fromCharCode(b);
        base64 = btoa(binary);
    }
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const fromBase64Url = (value: string): Uint8Array | null => {
    const normalized = normalizeBase64Url(value);
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    const base64 = normalized + padding;

    try {
        if (typeof Buffer !== 'undefined') {
            return new Uint8Array(Buffer.from(base64, 'base64'));
        }

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    } catch {
        return null;
    }
};

const getSessionSecret = () =>
    (
        process.env.SESSION_SECRET ||
        process.env.SUPABASE_DATABASE_URL ||
        process.env.SUPABASE_DB_URL ||
        ''
    ).trim();

const importSigningKey = async () => {
    const secret = getSessionSecret();
    if (!secret) return null;

    return crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
};

const signPayload = async (payloadBase64Url: string): Promise<string | null> => {
    const key = await importSigningKey();
    if (!key) return null;

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadBase64Url));
    return toBase64Url(new Uint8Array(signature));
};

const verifyPayload = async (payloadBase64Url: string, signatureBase64Url: string): Promise<boolean> => {
    const key = await importSigningKey();
    if (!key) return false;

    const signatureBytes = fromBase64Url(signatureBase64Url);
    if (!signatureBytes) return false;

    return crypto.subtle.verify(
        'HMAC',
        key,
        toArrayBuffer(signatureBytes),
        encoder.encode(payloadBase64Url)
    );
};

const isSessionRole = (role: unknown): role is SessionRole =>
    role === 'admin' || role === 'user' || role === 'agent';

const sanitizePayload = (value: unknown): SessionPayload | null => {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const candidate = value as SessionPayload;
    if (!isSessionRole(candidate.role)) {
        return null;
    }

    const payload: SessionPayload = { role: candidate.role };

    if (typeof candidate.userId === 'number' && Number.isFinite(candidate.userId)) {
        payload.userId = candidate.userId;
    }
    if (typeof candidate.username === 'string') {
        payload.username = candidate.username;
    }
    if (typeof candidate.displayName === 'string') {
        payload.displayName = candidate.displayName;
    }

    return payload;
};

export async function encodeSessionValue(payload: SessionPayload): Promise<string> {
    const sanitized = sanitizePayload(payload);
    if (!sanitized) {
        throw new Error('invalid_session_payload');
    }

    const payloadBase64Url = toBase64Url(encoder.encode(JSON.stringify(sanitized)));
    const signature = await signPayload(payloadBase64Url);
    if (!signature) {
        throw new Error('session_secret_not_configured');
    }

    const envelope: SignedSessionEnvelope = {
        v: SESSION_VERSION,
        p: payloadBase64Url,
        s: signature,
    };

    return JSON.stringify(envelope);
}

const parseEnvelope = (raw: string): SignedSessionEnvelope | null => {
    try {
        const parsed = JSON.parse(raw) as Partial<SignedSessionEnvelope>;
        if (
            parsed?.v !== SESSION_VERSION ||
            typeof parsed?.p !== 'string' ||
            typeof parsed?.s !== 'string'
        ) {
            return null;
        }
        return parsed as SignedSessionEnvelope;
    } catch {
        return null;
    }
};

export async function decodeSessionValue(raw: string | null | undefined): Promise<SessionPayload | null> {
    if (!raw) return null;

    const envelope = parseEnvelope(raw);
    if (!envelope) {
        return null;
    }

    const valid = await verifyPayload(envelope.p, envelope.s);
    if (!valid) {
        return null;
    }

    const payloadBytes = fromBase64Url(envelope.p);
    if (!payloadBytes) {
        return null;
    }

    try {
        const parsed = JSON.parse(decoder.decode(payloadBytes));
        return sanitizePayload(parsed);
    } catch {
        return null;
    }
}
