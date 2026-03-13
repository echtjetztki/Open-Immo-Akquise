import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { createClient } from '@supabase/supabase-js';
import getPool, { getDatabaseSource } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    let targetClient: PoolClient | null = null;

    try {
        const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
        const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({
                success: false,
                error: 'Supabase nicht konfiguriert. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt.',
            }, { status: 500 });
        }

        const dbSource = getDatabaseSource();
        if (dbSource === 'none') {
            return NextResponse.json({
                success: false,
                error: 'SUPABASE_DATABASE_URL oder SUPABASE_DB_URL fehlt. Ziel-Datenbank ist nicht konfiguriert.',
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const targetPool = await getPool();

        console.log('Starting Anzeigen-Sync (Supabase API)...');

        const { data: sourceProperties, error: supabaseError } = await supabase
            .from('immobilien')
            .select('external_id, plz, ort')
            .not('external_id', 'is', null);

        if (supabaseError) {
            throw new Error('Supabase API Fehler: ' + supabaseError.message);
        }

        if (!sourceProperties) {
            throw new Error('Keine Daten von Supabase empfangen.');
        }

        console.log(`Fetched ${sourceProperties.length} properties from Supabase.`);

        targetClient = await targetPool.connect();

        let updatedCount = 0;
        let errorCount = 0;

        for (const prop of sourceProperties) {
            if (!prop.external_id) continue;

            const plz = prop.plz ? prop.plz.toString().trim() : null;
            const ort = prop.ort ? prop.ort.toString().trim() : null;

            try {
                const updateRes = await targetClient.query(`
                    UPDATE "property-leads"
                    SET 
                        plz = CASE WHEN $1::text IS NOT NULL AND $1::text != '' THEN $1 ELSE plz END,
                        ort = CASE WHEN $2::text IS NOT NULL AND $2::text != '' THEN $2 ELSE ort END,
                        updated_at = NOW()
                    WHERE external_id = $3
                `, [plz, ort, prop.external_id]);

                if ((updateRes.rowCount || 0) > 0) {
                    updatedCount++;
                }
            } catch (error) {
                console.error(`Failed to update property ${prop.external_id}:`, error);
                errorCount++;
            }
        }

        console.log(`Sync completed. Updated: ${updatedCount}. Errors: ${errorCount}.`);

        return NextResponse.json({
            success: true,
            message: `Sync abgeschlossen. ${sourceProperties.length} Eintraege aus Supabase verarbeitet.`,
            updatedCount,
            errorCount,
            source: 'Supabase REST API (HTTPS)',
            databaseSource: dbSource,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        console.error('Critical Sync error:', message);
        return NextResponse.json({
            success: false,
            error: message,
        }, { status: 500 });
    } finally {
        if (targetClient) {
            targetClient.release();
        }
    }
}
