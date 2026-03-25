-- ==========================================
-- OPEN-AKQUISE MASTER SCHEMA SETUP
-- ==========================================
-- Kopiere diesen gesamten Block in den Supabase SQL Editor und klicke auf "Run".

-- 1. TABELLE: property-leads
CREATE TABLE IF NOT EXISTS "property-leads" (
  id BIGSERIAL PRIMARY KEY,
  link TEXT NOT NULL,
  title TEXT,
  external_id TEXT UNIQUE,
  uebergeben_am DATE NOT NULL,
  tagesdatum DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'Zu vergeben',
  
  -- Finanz-Daten
  kaufpreis DECIMAL(12, 2) NOT NULL DEFAULT 0,
  gesamtprovision DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.06) STORED,
  provision_abgeber DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.03) STORED,
  provision_kaeufer DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.03) STORED,
  berechnung DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.06 * 0.10) STORED,
  
  -- Neue Felder für Akquise
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

-- 2. TABELLE: users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELLE: property_notes
CREATE TABLE IF NOT EXISTS property_notes (
    id SERIAL PRIMARY KEY,
    property_id BIGINT REFERENCES "property-leads"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELLE: external_source_replies
CREATE TABLE IF NOT EXISTS external_source_replies (
    id SERIAL PRIMARY KEY,
    external_source_code TEXT NOT NULL,
    reply_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INITIALER LOGIN
-- Keine festen Demo-Passwoerter im Repository hinterlegen.
-- Der erste Login erfolgt ueber ADMIN_PASSWORD / USER_PASSWORD aus den ENV-Variablen.
-- Weitere Benutzer koennen danach im Admin-Bereich angelegt werden.

-- 6. INDEXE
CREATE INDEX IF NOT EXISTS idx_leads_status ON "property-leads"(status);
CREATE INDEX IF NOT EXISTS idx_leads_external_id ON "property-leads"(external_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 7. TRIGGER FÜR UPDATED_AT
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
CREATE TRIGGER trg_update_leads BEFORE UPDATE ON "property-leads" FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_users ON users;
CREATE TRIGGER trg_update_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
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
