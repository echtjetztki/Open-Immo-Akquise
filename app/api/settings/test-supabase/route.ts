import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
        const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({
                success: false,
                error: 'Supabase nicht konfiguriert. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt.',
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { count, error } = await supabase
            .from('immobilien')
            .select('*', { count: 'exact', head: true });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: 'Verbindung zur Supabase API erfolgreich (via REST API).',
            details: {
                count: count || 0,
                database: 'Supabase (HTTPS / REST API)',
                connection_type: 'Supabase Client',
            }
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('Supabase API Connection Error:', message);
        return NextResponse.json({
            success: false,
            error: 'Fehler bei Verbindung zu Supabase API: ' + message,
        }, { status: 500 });
    }
}
