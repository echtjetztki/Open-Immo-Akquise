import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
    try {
        const result = await query('SELECT reset_demo_data() as msg');
        return NextResponse.json({ success: true, message: result.rows[0]?.msg });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Reset fehlgeschlagen';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
