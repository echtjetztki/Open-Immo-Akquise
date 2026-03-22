import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await query('SELECT 1');
        return NextResponse.json({
            status: 'ok',
            message: 'System online.'
        });
    } catch (error: unknown) {
        console.error('Health Check Failed:', error);
        return NextResponse.json({
            status: 'error',
            message: 'System derzeit nicht erreichbar.'
        }, { status: 500 });
    }
}
