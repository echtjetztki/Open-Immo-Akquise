import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { blockDemoWrites, requireSessionUser } from '@/lib/access';

// Alle Einstellungen laden
export async function GET() {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;

        // Tabelle ggf. erstellen
        await query(`
            CREATE TABLE IF NOT EXISTS "crm_settings" (
                id SERIAL PRIMARY KEY,
                key VARCHAR(100) NOT NULL UNIQUE,
                value TEXT,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const result = await query('SELECT key, value FROM "crm_settings"');
        const settings: Record<string, string> = {};
        for (const row of result.rows) {
            settings[row.key] = row.value || '';
        }
        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: 'Fehler beim Laden', details: error.message }, { status: 500 });
    }
}

// Einstellungen speichern (Bulk upsert)
export async function POST(request: Request) {
    try {
        const access = await requireSessionUser(['admin']);
        if (!access.ok) return access.response;
        const demoBlock = blockDemoWrites();
        if (demoBlock) return demoBlock;

        const body = await request.json();

        // Tabelle ggf. erstellen
        await query(`
            CREATE TABLE IF NOT EXISTS "crm_settings" (
                id SERIAL PRIMARY KEY,
                key VARCHAR(100) NOT NULL UNIQUE,
                value TEXT,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Erlaubte Keys (Sicherheit)
        const allowedKeys = [
            'companyName', 'ownerName', 'address', 'city', 'phone', 'email',
            'iban', 'bic',
            'stripe_publishable_key', 'stripe_secret_key',
            'email_provider', // 'smtp' | 'ses' | 'none'
            'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure',
            'smtp_from_email', 'smtp_from_name',
            'ses_region', 'ses_access_key', 'ses_secret_key', 'ses_from_email',
        ];

        for (const [key, value] of Object.entries(body)) {
            if (!allowedKeys.includes(key)) continue;
            const strValue = (value as string) ?? '';
            // Leere Werte: bestehende Daten NICHT ueberschreiben
            if (strValue === '' || strValue === null || strValue === undefined) continue;
            await query(
                `INSERT INTO "crm_settings" (key, value, updated_at) 
                 VALUES ($1, $2, NOW()) 
                 ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
                [key, strValue]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Speichern fehlgeschlagen', details: error.message }, { status: 500 });
    }
}
