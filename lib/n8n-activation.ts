import { query } from '@/lib/db';
import { hashLicenseCode, resolveInstallContext } from '@/lib/license';

type N8nActivationKeyRow = {
    id: number;
    code_hash: string;
    is_active: boolean;
    max_installations: number | null;
};

export type N8nActivationState = {
    active: boolean;
    cacheTtlSeconds: number;
    message?: string;
};

const DEFAULT_N8N_CACHE_TTL_SECONDS = 60 * 60 * 24 * 365;

export async function ensureN8nActivationTables(): Promise<void> {
    await query(`
        CREATE TABLE IF NOT EXISTS n8n_activation_keys (
            id BIGSERIAL PRIMARY KEY,
            code_hash TEXT NOT NULL UNIQUE,
            label TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            max_installations INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS n8n_activation_installations (
            id BIGSERIAL PRIMARY KEY,
            activation_key_id BIGINT NOT NULL REFERENCES n8n_activation_keys(id) ON DELETE CASCADE,
            install_host TEXT NOT NULL,
            install_origin TEXT NOT NULL,
            install_path TEXT NOT NULL DEFAULT '/',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            first_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE (activation_key_id, install_host, install_path)
        )
    `);

    await query(`ALTER TABLE n8n_activation_keys ADD COLUMN IF NOT EXISTS label TEXT`);
    await query(`ALTER TABLE n8n_activation_keys ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`);
    await query(`ALTER TABLE n8n_activation_keys ADD COLUMN IF NOT EXISTS max_installations INTEGER NOT NULL DEFAULT 1`);
    await query(`ALTER TABLE n8n_activation_keys ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);
    await query(`ALTER TABLE n8n_activation_keys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);

    await query(`ALTER TABLE n8n_activation_installations ADD COLUMN IF NOT EXISTS install_origin TEXT NOT NULL DEFAULT ''`);
    await query(`ALTER TABLE n8n_activation_installations ADD COLUMN IF NOT EXISTS install_path TEXT NOT NULL DEFAULT '/'`);
    await query(`ALTER TABLE n8n_activation_installations ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`);
    await query(`ALTER TABLE n8n_activation_installations ADD COLUMN IF NOT EXISTS first_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);
    await query(`ALTER TABLE n8n_activation_installations ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);

    await query('CREATE INDEX IF NOT EXISTS n8n_activation_keys_active_idx ON n8n_activation_keys(is_active)');
    await query('CREATE INDEX IF NOT EXISTS n8n_activation_installations_host_path_idx ON n8n_activation_installations(install_host, install_path)');
    await query('CREATE UNIQUE INDEX IF NOT EXISTS n8n_activation_installations_unique_idx ON n8n_activation_installations(activation_key_id, install_host, install_path)');
}

async function getActiveN8nKeyByHash(codeHash: string): Promise<N8nActivationKeyRow | null> {
    const result = await query(
        `SELECT id, code_hash, is_active, max_installations
         FROM n8n_activation_keys
         WHERE code_hash = $1 AND is_active = TRUE
         LIMIT 1`,
        [codeHash]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0] as N8nActivationKeyRow;
}

async function ensureEnvFallbackN8nKey(codeHash: string): Promise<N8nActivationKeyRow | null> {
    const expectedHash = (process.env.N8N_ACTIVATION_HASH || '').trim().toLowerCase();
    if (!expectedHash || expectedHash !== codeHash.toLowerCase()) {
        return null;
    }

    const upsert = await query(
        `INSERT INTO n8n_activation_keys (code_hash, label, is_active, max_installations)
         VALUES ($1, $2, TRUE, 1)
         ON CONFLICT (code_hash)
         DO UPDATE SET
            is_active = TRUE,
            max_installations = 1,
            updated_at = NOW()
         RETURNING id, code_hash, is_active, max_installations`,
        [codeHash, 'ENV_IMPORTED_N8N']
    );

    return (upsert.rows[0] as N8nActivationKeyRow) || null;
}

export async function verifyN8nActivationCodeAgainstDb(rawCode: string): Promise<N8nActivationKeyRow | null> {
    await ensureN8nActivationTables();

    const codeHash = hashLicenseCode(rawCode);
    const fromDb = await getActiveN8nKeyByHash(codeHash);
    if (fromDb) {
        return fromDb;
    }

    return ensureEnvFallbackN8nKey(codeHash);
}

export async function registerN8nActivationInstallation(
    activationKeyId: number,
    request: Request
): Promise<void> {
    const context = resolveInstallContext(request);

    const limitCheck = await query(
        `SELECT nk.max_installations,
                EXISTS(
                    SELECT 1
                    FROM n8n_activation_installations ni
                    WHERE ni.activation_key_id = nk.id
                      AND ni.install_host = $2
                      AND ni.install_path = $3
                ) AS existing_installation,
                (
                    SELECT COUNT(*)
                    FROM n8n_activation_installations ni
                    WHERE ni.activation_key_id = nk.id
                      AND ni.is_active = TRUE
                ) AS active_installations
         FROM n8n_activation_keys nk
         WHERE nk.id = $1
         LIMIT 1`,
        [activationKeyId, context.host, context.path]
    );

    const row = limitCheck.rows[0] as
        | { max_installations: number | null; existing_installation: boolean; active_installations: string }
        | undefined;

    if (!row) {
        throw new Error('n8n_activation_key_not_found');
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
        throw new Error('n8n_activation_limit_reached');
    }

    await query(
        `INSERT INTO n8n_activation_installations (
            activation_key_id,
            install_host,
            install_origin,
            install_path,
            is_active,
            first_verified_at,
            last_verified_at
         )
         VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
         ON CONFLICT (activation_key_id, install_host, install_path)
         DO UPDATE SET
            is_active = TRUE,
            install_origin = EXCLUDED.install_origin,
            last_verified_at = NOW()`,
        [activationKeyId, context.host, context.origin, context.path]
    );
}

export async function hasActiveN8nActivationForRequest(request: Request): Promise<boolean> {
    await ensureN8nActivationTables();
    const context = resolveInstallContext(request);

    const result = await query(
        `SELECT 1
         FROM n8n_activation_installations ni
         JOIN n8n_activation_keys nk ON nk.id = ni.activation_key_id
         WHERE ni.is_active = TRUE
           AND nk.is_active = TRUE
           AND ni.install_host = $1
           AND (ni.install_path = $2 OR ni.install_path = '/')
         LIMIT 1`,
        [context.host, context.path]
    );

    return result.rows.length > 0;
}

export async function activateN8nCodeForRequest(
    request: Request,
    rawCode: string
): Promise<N8nActivationState> {
    const code = rawCode.trim();
    if (!code) {
        return {
            active: false,
            cacheTtlSeconds: DEFAULT_N8N_CACHE_TTL_SECONDS,
            message: 'Aktivierungscode fehlt.'
        };
    }

    const activationKey = await verifyN8nActivationCodeAgainstDb(code);
    if (!activationKey) {
        return {
            active: false,
            cacheTtlSeconds: DEFAULT_N8N_CACHE_TTL_SECONDS,
            message: 'Ungueltiger oder inaktiver n8n Aktivierungscode.'
        };
    }

    try {
        await registerN8nActivationInstallation(activationKey.id, request);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'n8n_activation_limit_reached') {
            return {
                active: false,
                cacheTtlSeconds: DEFAULT_N8N_CACHE_TTL_SECONDS,
                message: 'Maximale Anzahl von Installationen fuer diesen n8n Code erreicht.'
            };
        }
        throw error;
    }

    return {
        active: true,
        cacheTtlSeconds: DEFAULT_N8N_CACHE_TTL_SECONDS
    };
}

export async function checkN8nActivationForRequest(request: Request): Promise<N8nActivationState> {
    const active = await hasActiveN8nActivationForRequest(request);
    return {
        active,
        cacheTtlSeconds: DEFAULT_N8N_CACHE_TTL_SECONDS
    };
}
