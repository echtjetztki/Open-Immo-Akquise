import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireSessionUser } from '@/lib/access';

export async function GET() {
    const access = await requireSessionUser(['admin']);
    if (!access.ok) {
        return access.response;
    }

    try {
        const pool = await getPool();
        const res = await pool.query('SELECT version()');
        return NextResponse.json({ 
            status: 'success', 
            dbVersion: res.rows[0].version,
            env: {
                has_db_url: !!(process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_DB_URL),
                node_env: process.env.NODE_ENV,
                tls_reject: process.env.NODE_TLS_REJECT_UNAUTHORIZED
            }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        return NextResponse.json({ 
            status: 'error', 
            message,
            env: {
                tls_reject: process.env.NODE_TLS_REJECT_UNAUTHORIZED
            }
        }, { status: 500 });
    }
}
