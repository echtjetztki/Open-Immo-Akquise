import crypto from 'crypto';

const HASH_PREFIX = 'scrypt';
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
    return `${HASH_PREFIX}$${salt}$${derived}`;
}

function isStructuredHash(value: string): boolean {
    return value.startsWith(`${HASH_PREFIX}$`);
}

export function isLegacyPlaintextPasswordHash(value: string | null | undefined): boolean {
    if (!value) return false;
    return !isStructuredHash(value);
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
    if (!storedHash) return false;

    if (!isStructuredHash(storedHash)) {
        // Backward compatibility for existing plaintext rows.
        return password === storedHash;
    }

    const parts = storedHash.split('$');
    if (parts.length !== 3) {
        return false;
    }

    const salt = parts[1];
    const expectedHex = parts[2];
    const actualHex = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');

    const expected = Buffer.from(expectedHex, 'hex');
    const actual = Buffer.from(actualHex, 'hex');
    if (expected.length !== actual.length) {
        return false;
    }

    return crypto.timingSafeEqual(expected, actual);
}
