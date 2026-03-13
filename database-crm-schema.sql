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
    customer_id INTEGER REFERENCES "crm_customers"(id) ON DELETE SET NULL,
    customer_name VARCHAR(255), 
    customer_email VARCHAR(255),
    customer_address TEXT,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Entwurf', -- Entwurf, Gesendet, Bezahlt, Storniert
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
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
