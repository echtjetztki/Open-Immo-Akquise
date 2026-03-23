// Stripe-Keys in die DB speichern
// Ausfuehren: SUPABASE_DB_URL=... STRIPE_PK=pk_... STRIPE_SK=sk_... node scripts/seed-stripe-keys.js
const { Pool } = require('pg');
const dbUrl = process.env.SUPABASE_DB_URL || process.env.SUPABASE_DATABASE_URL;
if (!dbUrl) { console.error('Keine DB URL'); process.exit(1); }

const pk = process.env.STRIPE_PK;
const sk = process.env.STRIPE_SK;
if (!pk || !sk) { console.error('Bitte STRIPE_PK und STRIPE_SK als ENV setzen'); process.exit(1); }

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function run() {
    const keys = [
        ['stripe_publishable_key', pk],
        ['stripe_secret_key', sk],
    ];

    for (const [key, value] of keys) {
        await pool.query(
            `INSERT INTO "crm_settings" (key, value, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
            [key, value]
        );
        console.log('Gesetzt:', key);
    }

    const result = await pool.query(`SELECT key, SUBSTRING(value, 1, 20) as preview FROM "crm_settings" WHERE key LIKE 'stripe%'`);
    console.log('Gespeichert:', result.rows);
    await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
