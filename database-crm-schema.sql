-- =============================================
-- CRM Schema v2.0 – Open-Immo-Akquise
-- Erweitert um: Dokumenttypen, Zahlungsstatus,
-- Stripe-Integration und Vorkasse
-- =============================================

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
    -- Dokumenttyp: Angebot, Expose, Rechnung
    doc_type VARCHAR(50) DEFAULT 'Rechnung',
    customer_id INTEGER REFERENCES "crm_customers"(id) ON DELETE SET NULL,
    customer_name VARCHAR(255), 
    customer_email VARCHAR(255),
    customer_address TEXT,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    -- Status: Entwurf, Offen, Bezahlt, Inkasso, Storniert
    status VARCHAR(50) DEFAULT 'Entwurf',
    -- Zahlungsmethode: stripe, vorkasse, bar, null
    payment_method VARCHAR(50),
    -- Stripe Payment Link URL (automatisch generiert)
    stripe_payment_link VARCHAR(500),
    -- Stripe Payment Intent oder Session ID
    stripe_session_id VARCHAR(255),
    -- Wann bezahlt
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

-- CRM Einstellungen (Stammdaten, Stripe, SMTP, SES)
CREATE TABLE IF NOT EXISTS "crm_settings" (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migrationsschritte für bestehende Datenbanken:
-- ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS doc_type VARCHAR(50) DEFAULT 'Rechnung';
-- ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
-- ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS stripe_payment_link VARCHAR(500);
-- ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
-- ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE "crm_invoices" ADD COLUMN IF NOT EXISTS notes TEXT;
