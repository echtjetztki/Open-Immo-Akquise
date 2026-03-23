// Migrationsskript: Neue CRM-Spalten und crm_settings Tabelle
// Ausfuehren: node scripts/migrate-crm-v2.js

const { Pool } = require('pg');

const dbUrl = process.env.SUPABASE_DB_URL || process.env.SUPABASE_DATABASE_URL;
if (!dbUrl) { console.error('Keine DB URL'); process.exit(1); }

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starte CRM v2 Migration...');

        const migrations = [
            `ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS doc_type VARCHAR(50) DEFAULT 'Rechnung'`,
            `ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`,
            `ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS stripe_payment_link VARCHAR(500)`,
            `ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255)`,
            `ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE`,
            `ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS notes TEXT`,
            `CREATE TABLE IF NOT EXISTS "crm_settings" (
                id SERIAL PRIMARY KEY,
                key VARCHAR(100) NOT NULL UNIQUE,
                value TEXT,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
        ];

        for (const sql of migrations) {
            try {
                await client.query(sql);
                console.log('OK:', sql.substring(0, 80) + '...');
            } catch (err) {
                console.log('SKIP (existiert bereits):', err.message.substring(0, 80));
            }
        }

        console.log('\nMigration abgeschlossen!');
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(e => { console.error('Migration fehlgeschlagen:', e); process.exit(1); });
