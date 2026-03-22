import crypto from 'crypto';
import { query } from '@/lib/db';

type InstallContext = {
    host: string;
    origin: string;
    path: string;
};

type LicenseKeyRow = {
    id: number;
    code_hash: string;
    is_active: boolean;
    max_installations: number | null;
};

export type LicenseState = {
    active: boolean;
    cacheTtlSeconds: number;
    message?: string;
};

const DEFAULT_LICENSE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 365;

const normalizeHost = (value: string) => {
    const host = value.trim().toLowerCase();
    if (host.endsWith(':443')) return host.slice(0, -4);
    if (host.endsWith(':80')) return host.slice(0, -3);
    return host;
};

const normalizePath = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '/';
    const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    if (withSlash.length > 1 && withSlash.endsWith('/')) {
        return withSlash.slice(0, -1);
    }
    return withSlash;
};

const firstHeader = (value: string | null) => {
    if (!value) return '';
    return value.split(',')[0].trim();
};

export const hashLicenseCode = (code: string) =>
    crypto.createHash('sha256').update(code.trim(), 'utf8').digest('hex');

export async function ensureLicenseTables(): Promise<void> {
    await query(`
        CREATE TABLE IF NOT EXISTS license_keys (
            id BIGSERIAL PRIMARY KEY,
            code_hash TEXT NOT NULL UNIQUE,
            label TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            max_installations INTEGER,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS license_installations (
            id BIGSERIAL PRIMARY KEY,
            license_key_id BIGINT NOT NULL REFERENCES license_keys(id) ON DELETE CASCADE,
            install_host TEXT NOT NULL,
            install_origin TEXT NOT NULL,
            install_path TEXT NOT NULL DEFAULT '/',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            first_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE (license_key_id, install_host, install_path)
        )
    `);

    await query(`ALTER TABLE license_keys ADD COLUMN IF NOT EXISTS label TEXT`);
    await query(`ALTER TABLE license_keys ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`);
    await query(`ALTER TABLE license_keys ADD COLUMN IF NOT EXISTS max_installations INTEGER`);
    await query(`ALTER TABLE license_keys ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);
    await query(`ALTER TABLE license_keys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);

    await query(`ALTER TABLE license_installations ADD COLUMN IF NOT EXISTS install_origin TEXT NOT NULL DEFAULT ''`);
    await query(`ALTER TABLE license_installations ADD COLUMN IF NOT EXISTS install_path TEXT NOT NULL DEFAULT '/'`);
    await query(`ALTER TABLE license_installations ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`);
    await query(`ALTER TABLE license_installations ADD COLUMN IF NOT EXISTS first_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);
    await query(`ALTER TABLE license_installations ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);

    await query('CREATE INDEX IF NOT EXISTS license_keys_active_idx ON license_keys(is_active)');
    await query('CREATE INDEX IF NOT EXISTS license_installations_host_path_idx ON license_installations(install_host, install_path)');
    await query('CREATE UNIQUE INDEX IF NOT EXISTS license_installations_unique_install_idx ON license_installations(license_key_id, install_host, install_path)');
}

export function resolveInstallContext(request: Request): InstallContext {
    const url = new URL(request.url);

    const forwardedHost = firstHeader(request.headers.get('x-forwarded-host'));
    const forwardedProto = firstHeader(request.headers.get('x-forwarded-proto'));
    const forwardedPrefix = firstHeader(request.headers.get('x-forwarded-prefix'));

    const host = normalizeHost(forwardedHost || request.headers.get('host') || url.host);
    const proto = (forwardedProto || url.protocol.replace(':', '') || 'https').toLowerCase();
    const origin = `${proto}://${host}`;
    const path = normalizePath(forwardedPrefix || '/');

    return { host, origin, path };
}

async function getActiveLicenseByHash(codeHash: string): Promise<LicenseKeyRow | null> {
    const result = await query(
        `SELECT id, code_hash, is_active, max_installations
         FROM license_keys
         WHERE code_hash = $1 AND is_active = TRUE
         LIMIT 1`,
        [codeHash]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0] as LicenseKeyRow;
}

async function ensureEnvFallbackLicense(codeHash: string): Promise<LicenseKeyRow | null> {
    const expectedHash = (process.env.BASIC_LICENSE_HASH || '').trim().toLowerCase();
    if (!expectedHash || expectedHash !== codeHash.toLowerCase()) {
        return null;
    }

    const upsert = await query(
        `INSERT INTO license_keys (code_hash, label, is_active)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (code_hash)
         DO UPDATE SET is_active = TRUE, updated_at = NOW()
         RETURNING id, code_hash, is_active, max_installations`,
        [codeHash, 'ENV_IMPORTED']
    );

    return (upsert.rows[0] as LicenseKeyRow) || null;
}

export async function verifyLicenseCodeAgainstDb(rawCode: string): Promise<LicenseKeyRow | null> {
    await ensureLicenseTables();

    const codeHash = hashLicenseCode(rawCode);
    const fromDb = await getActiveLicenseByHash(codeHash);
    if (fromDb) {
        return fromDb;
    }

    return ensureEnvFallbackLicense(codeHash);
}

export async function registerLicenseInstallation(
    licenseKeyId: number,
    context: InstallContext
): Promise<void> {
    const limitCheck = await query(
        `SELECT lk.max_installations,
                EXISTS(
                    SELECT 1
                    FROM license_installations li
                    WHERE li.license_key_id = lk.id
                      AND li.install_host = $2
                      AND li.install_path = $3
                ) AS existing_installation,
                (
                    SELECT COUNT(*)
                    FROM license_installations li
                    WHERE li.license_key_id = lk.id
                      AND li.is_active = TRUE
                ) AS active_installations
         FROM license_keys lk
         WHERE lk.id = $1
         LIMIT 1`,
        [licenseKeyId, context.host, context.path]
    );

    const row = limitCheck.rows[0] as
        | { max_installations: number | null; existing_installation: boolean; active_installations: string }
        | undefined;

    if (!row) {
        throw new Error('license_key_not_found');
    }

    const maxInstallations = row.max_installations;
    const existingInstallation = row.existing_installation;
    const activeInstallations = Number.parseInt(row.active_installations || '0', 10);

    if (
        !existingInstallation &&
        maxInstallations !== null &&
        Number.isFinite(maxInstallations) &&
        activeInstallations >= maxInstallations
    ) {
        throw new Error('license_install_limit_reached');
    }

    await query(
        `INSERT INTO license_installations (
            license_key_id,
            install_host,
            install_origin,
            install_path,
            is_active,
            first_verified_at,
            last_verified_at
         )
         VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
         ON CONFLICT (license_key_id, install_host, install_path)
         DO UPDATE SET
            is_active = TRUE,
            install_origin = EXCLUDED.install_origin,
            last_verified_at = NOW()`,
        [licenseKeyId, context.host, context.origin, context.path]
    );
}

export async function hasActiveLicenseForRequest(request: Request): Promise<boolean> {
    await ensureLicenseTables();
    const context = resolveInstallContext(request);

    const result = await query(
        `SELECT 1
         FROM license_installations li
         JOIN license_keys lk ON lk.id = li.license_key_id
         WHERE li.is_active = TRUE
           AND lk.is_active = TRUE
           AND li.install_host = $1
           AND (li.install_path = $2 OR li.install_path = '/')
         LIMIT 1`,
        [context.host, context.path]
    );

    return result.rows.length > 0;
}

export async function activateLicenseCodeWithServer(
    request: Request,
    rawCode: string
): Promise<LicenseState> {
    const code = rawCode.trim();
    if (!code) {
        return {
            active: false,
            cacheTtlSeconds: DEFAULT_LICENSE_CACHE_TTL_SECONDS,
            message: 'Lizenzcode fehlt.'
        };
    }

    const license = await verifyLicenseCodeAgainstDb(code);
    if (!license) {
        return {
            active: false,
            cacheTtlSeconds: DEFAULT_LICENSE_CACHE_TTL_SECONDS,
            message: 'Ungueltiger oder inaktiver Lizenzcode.'
        };
    }

    const installContext = resolveInstallContext(request);
    try {
        await registerLicenseInstallation(license.id, installContext);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'license_install_limit_reached') {
            return {
                active: false,
                cacheTtlSeconds: DEFAULT_LICENSE_CACHE_TTL_SECONDS,
                message: 'Maximale Anzahl von Installationen fuer diesen Lizenzcode erreicht.'
            };
        }
        throw error;
    }

    return {
        active: true,
        cacheTtlSeconds: DEFAULT_LICENSE_CACHE_TTL_SECONDS
    };
}

export async function checkActiveLicenseForRequest(request: Request): Promise<LicenseState> {
    const active = await hasActiveLicenseForRequest(request);
    return {
        active,
        cacheTtlSeconds: DEFAULT_LICENSE_CACHE_TTL_SECONDS
    };
}
