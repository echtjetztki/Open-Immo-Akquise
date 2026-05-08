-- ============================================================
-- OPEN-IMMO-AKQUISE — VOLLSTÄNDIGES SCHEMA-SETUP
-- ============================================================
-- Anleitung:
-- 1. Im Supabase-Dashboard öffnen:
--    https://supabase.com/dashboard/project/<PROJECT-REF>/sql/new
-- 2. Diesen kompletten Inhalt einfügen.
-- 3. Auf "Run" klicken.
--
-- Idempotent: kann mehrfach ausgeführt werden, ohne Schaden anzurichten.
-- Auto-erstellte Tabellen (referrals, license_keys, license_installations)
-- werden zusätzlich beim ersten App-Request automatisch angelegt.
-- ============================================================


-- ============================================================
-- TEIL 1 — KERN-SCHEMA (Properties, Users, Notes, Replies)
-- ============================================================

-- 1.1 Property-Leads
CREATE TABLE IF NOT EXISTS "property-leads" (
    id BIGSERIAL PRIMARY KEY,
    link TEXT NOT NULL,
    title TEXT,
    external_id TEXT UNIQUE,
    uebergeben_am DATE NOT NULL,
    tagesdatum DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    status TEXT NOT NULL DEFAULT 'Zu vergeben',

    kaufpreis DECIMAL(12, 2) NOT NULL DEFAULT 0,
    gesamtprovision DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.06) STORED,
    provision_abgeber DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.03) STORED,
    provision_kaeufer DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.03) STORED,
    berechnung DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.06 * 0.10) STORED,

    email TEXT,
    telefonnummer TEXT,
    objekttyp TEXT DEFAULT 'Kauf',
    plz TEXT,
    ort TEXT,
    betreut_von TEXT,
    provision_abgeber_custom DECIMAL(12, 2),
    provision_kaeufer_custom DECIMAL(12, 2),
    notizfeld TEXT,
    status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 Property Notes
CREATE TABLE IF NOT EXISTS property_notes (
    id SERIAL PRIMARY KEY,
    property_id BIGINT REFERENCES "property-leads"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.4 External Source Replies
CREATE TABLE IF NOT EXISTS external_source_replies (
    id SERIAL PRIMARY KEY,
    external_source_code TEXT NOT NULL,
    reply_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.5 Indexe
CREATE INDEX IF NOT EXISTS idx_leads_status ON "property-leads"(status);
CREATE INDEX IF NOT EXISTS idx_leads_external_id ON "property-leads"(external_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 1.6 Trigger für updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF (TG_TABLE_NAME = 'property-leads' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        NEW.status_changed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_leads ON "property-leads";
CREATE TRIGGER trg_update_leads BEFORE UPDATE ON "property-leads"
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_users ON users;
CREATE TRIGGER trg_update_users BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();


-- ============================================================
-- TEIL 2 — LIZENZ-TABELLEN (werden auch automatisch erstellt)
-- ============================================================

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
CREATE INDEX IF NOT EXISTS license_installations_host_path_idx
    ON public.license_installations(install_host, install_path);


-- ============================================================
-- TEIL 3 — CRM-SCHEMA (Kunden, Artikel, Rechnungen, Settings)
-- ============================================================

CREATE TABLE IF NOT EXISTS "crm_customers" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(255),
    company VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "crm_articles" (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'Stück',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "crm_invoices" (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    doc_type VARCHAR(50) DEFAULT 'Rechnung',
    customer_id INTEGER REFERENCES "crm_customers"(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_address TEXT,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Entwurf',
    payment_method VARCHAR(50),
    stripe_payment_link VARCHAR(500),
    stripe_session_id VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "crm_invoice_items" (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES "crm_invoices"(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES "crm_articles"(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "crm_settings" (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- TEIL 4 — REFERRALS (wird auch automatisch erstellt)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_address TEXT,
    client_phone TEXT,
    recommender_name TEXT NOT NULL,
    recommender_email TEXT,
    commission_pct NUMERIC DEFAULT 10,
    status TEXT DEFAULT 'Neu',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    agent_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON public.referrals (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_agent_id ON public.referrals (agent_id);


-- ============================================================
-- FERTIG. Tabellen-Übersicht zur Kontrolle:
-- ============================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
