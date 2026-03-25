const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            let value = valueParts.join('=').trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            process.env[key.trim()] = value;
        }
    });
}

const dbUrl = process.env.SUPABASE_DB_URL || process.env.SUPABASE_DATABASE_URL;

if (!dbUrl) {
    console.error('ERROR: SUPABASE_DB_URL not found in .env.local');
    process.exit(1);
}

const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

const sql = `
-- 8. TABELLEN: Lizenzen & Aktivierung
CREATE TABLE IF NOT EXISTS public.license_keys (
  id BIGSERIAL PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  max_installations INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.license_installations (
  id BIGSERIAL PRIMARY KEY,
  license_key_id BIGINT NOT NULL REFERENCES public.license_keys(id) ON DELETE CASCADE,
  install_host TEXT NOT NULL,
  install_origin TEXT NOT NULL,
  install_path TEXT NOT NULL DEFAULT '/',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  first_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (license_key_id, install_host, install_path)
);

CREATE INDEX IF NOT EXISTS license_keys_active_idx ON public.license_keys(is_active);
CREATE INDEX IF NOT EXISTS license_installations_host_path_idx ON public.license_installations(install_host, install_path);
`;

async function run() {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
        console.log('Executing SQL...');
        await client.query(sql);
        console.log('SUCCESS: License tables created/verified.');
    } catch (err) {
        console.error('DATABASE ERROR:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
