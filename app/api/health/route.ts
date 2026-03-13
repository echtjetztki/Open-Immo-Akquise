import { NextResponse } from 'next/server';
import { getDatabaseSource, query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await query('SELECT 1');
        return NextResponse.json({
            status: 'ok',
            source: getDatabaseSource(),
            message: 'Supabase-Datenbank-Verbindung erfolgreich hergestellt.'
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('Health Check Failed:', error);
        return NextResponse.json({
            status: 'error',
            source: getDatabaseSource(),
            message: 'Verbindung fehlgeschlagen: ' + message
        }, { status: 500 });
    }
}
