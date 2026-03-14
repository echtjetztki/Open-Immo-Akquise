import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
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
    } catch (e: any) {
        return NextResponse.json({ 
            status: 'error', 
            message: e.message,
            stack: e.stack,
            env: {
                tls_reject: process.env.NODE_TLS_REJECT_UNAUTHORIZED
            }
        }, { status: 500 });
    }
}
