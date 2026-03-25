const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SESSION_VERSION = 2; // Incremented version for encryption

export type SessionRole = 'admin' | 'user' | 'agent';

export type SessionPayload = {
    userId?: number;
    username?: string;
    displayName?: string;
    role?: SessionRole;
};

/**
 * Encrypted Session Envelope
 */
type EncryptedSessionEnvelope = {
    v: number;
    iv: string;
    p: string;
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
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    const base64 = normalized + padding;
    try {
        if (typeof Buffer !== 'undefined') {
            return new Uint8Array(Buffer.from(base64, 'base64'));
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    } catch { return null; }
};

const getSessionSecret = () =>
    (process.env.SESSION_SECRET || process.env.SUPABASE_DATABASE_URL || 'fallback-secret-key-at-least-32-chars-long-!!!').trim();

/**
 * Derives a cryptographic key from the session secret
 */
const getEncryptionKey = async () => {
    const secret = getSessionSecret();
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
    return crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
};

const isSessionRole = (role: unknown): role is SessionRole =>
    role === 'admin' || role === 'user' || role === 'agent';

const sanitizePayload = (value: unknown): SessionPayload | null => {
    if (!value || typeof value !== 'object') return null;
    const candidate = value as SessionPayload;
    if (!isSessionRole(candidate.role)) return null;
    const payload: SessionPayload = { role: candidate.role };
    if (typeof candidate.userId === 'number') payload.userId = candidate.userId;
    if (typeof candidate.username === 'string') payload.username = candidate.username;
    if (typeof candidate.displayName === 'string') payload.displayName = candidate.displayName;
    return payload;
};

export async function encodeSessionValue(payload: SessionPayload): Promise<string> {
    const sanitized = sanitizePayload(payload);
    if (!sanitized) throw new Error('invalid_session_payload');

    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(JSON.stringify(sanitized))
    );

    const envelope: EncryptedSessionEnvelope = {
        v: SESSION_VERSION,
        iv: toBase64Url(iv),
        p: toBase64Url(new Uint8Array(encrypted)),
    };

    return JSON.stringify(envelope);
}

export async function decodeSessionValue(raw: string | null | undefined): Promise<SessionPayload | null> {
    if (!raw) return null;

    try {
        const envelope = JSON.parse(raw) as Partial<EncryptedSessionEnvelope>;
        if (envelope.v !== SESSION_VERSION || !envelope.iv || !envelope.p) return null;

        const key = await getEncryptionKey();
        const iv = fromBase64Url(envelope.iv);
        const ciphertext = fromBase64Url(envelope.p);
        if (!iv || !ciphertext) return null;

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        const parsed = JSON.parse(decoder.decode(decrypted));
        return sanitizePayload(parsed);
    } catch (e) {
        console.error('Session decryption failed:', e);
        return null;
    }
}
