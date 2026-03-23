export const DEMO_READ_ONLY_MESSAGE = 'Die öffentliche Demo ist schreibgeschützt.';

const normalizeFlag = (value: string | undefined) => value?.trim().toLowerCase() === 'true';

export function isDemoReadOnly(): boolean {
    return false; // Internal dev version: Always writable
}
