import { Pool, PoolConfig } from 'pg';

let pool: Pool | undefined;

const normalizeConnectionString = (value: string) => {
    const trimmed = value.trim().replace(/\r?\n/g, '');
    if (!trimmed) {
        return '';
    }

    if (/[?&]sslmode=/.test(trimmed)) {
        return trimmed;
    }

    return `${trimmed}${trimmed.includes('?') ? '&' : '?'}sslmode=require`;
};

export const getDatabaseSource = () => {
    if ((process.env.SUPABASE_DATABASE_URL || '').trim()) {
        return 'SUPABASE_DATABASE_URL';
    }

    if ((process.env.SUPABASE_DB_URL || '').trim()) {
        return 'SUPABASE_DB_URL';
    }

    return 'none';
};

export const getDatabaseUrl = () => {
    const source = getDatabaseSource();

    if (source === 'SUPABASE_DATABASE_URL') {
        return normalizeConnectionString(process.env.SUPABASE_DATABASE_URL || '');
    }

    if (source === 'SUPABASE_DB_URL') {
        return normalizeConnectionString(process.env.SUPABASE_DB_URL || '');
    }

    return '';
};

export const hasDatabaseUrl = () => getDatabaseSource() !== 'none';

export const getPool = async () => {
    if (pool) return pool;

    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
        throw new Error('Keine Supabase-Datenbank-URL gefunden. Bitte SUPABASE_DATABASE_URL oder SUPABASE_DB_URL setzen.');
    }

    const isVercel = process.env.VERCEL === '1';
    const poolConfig: PoolConfig = {
        connectionString: dbUrl,
        max: isVercel ? 1 : 10,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 15000,
        ssl: { rejectUnauthorized: false }
    };

    pool = new Pool(poolConfig);

    pool.on('error', (err) => {
        console.error('Unexpected DB pool error:', err.message);
        pool = undefined;
    });

    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log(`Supabase Database connected (${isVercel ? 'Vercel' : 'Local'})`);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown DB error';
        console.error('Supabase connection failed:', message);
        pool = undefined;
        throw error;
    }

    return pool;
};

export async function query(text: string, params?: unknown[]) {
    const activePool = await getPool();
    return activePool.query(text, params);
}

export default getPool;
