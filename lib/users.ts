import { query } from '@/lib/db';
import { DEFAULT_AGENT_OPTIONS } from '@/lib/agent-options';

export type ManagedUserRole = 'admin' | 'user' | 'agent';

export async function ensureUsersTable(): Promise<void> {
    await query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            display_name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

    await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx ON users (username)`);
    await query(`CREATE INDEX IF NOT EXISTS users_role_idx ON users (role)`);
}

export async function getAgentOptions(): Promise<string[]> {
    try {
        await ensureUsersTable();
        const result = await query(
            `SELECT COALESCE(NULLIF(TRIM(display_name), ''), username) AS agent_name
             FROM users
             WHERE role = 'agent'
             ORDER BY COALESCE(NULLIF(TRIM(display_name), ''), username) ASC`
        );

        const unique = new Map<string, string>();
        for (const row of result.rows) {
            const value = (row.agent_name ?? '').toString().trim();
            if (!value) {
                continue;
            }

            const key = value.toLowerCase();
            if (!unique.has(key)) {
                unique.set(key, value);
            }
        }

        const agents = Array.from(unique.values());
        if (agents.length > 0) {
            return agents;
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown users table error';
        console.error('Failed to load agents from users table:', message);
    }

    return [...DEFAULT_AGENT_OPTIONS];
}
