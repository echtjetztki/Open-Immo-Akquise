import { query } from '@/lib/db';

const PROPERTY_STATUSES = [
    'NEU',
    'Zu vergeben',
    'Von GP kontaktiert',
    'Aufgenommen',
    'Vermarktung',
    'Abschluss/Verkauf',
    'Follow-up',
    'Storniert',
];

let propertySchemaPromise: Promise<void> | null = null;

const quotedStatuses = PROPERTY_STATUSES
    .map((status) => `'${status.replace(/'/g, "''")}'`)
    .join(', ');

export const parseOptionalDecimal = (value: unknown) => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    const normalized = value
        .toString()
        .trim()
        .replace(/%/g, '')
        .replace(/\s+/g, '')
        .replace(',', '.');

    if (!normalized) {
        return null;
    }

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
};

export async function ensurePropertySchema(): Promise<void> {
    if (propertySchemaPromise) {
        return propertySchemaPromise;
    }

    propertySchemaPromise = (async () => {
        await query(`
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
            )
        `);

        await query(`ALTER TABLE "property-leads" ADD COLUMN IF NOT EXISTS title TEXT`);
        await query(`ALTER TABLE "property-leads" ADD COLUMN IF NOT EXISTS email TEXT`);
        await query(`ALTER TABLE "property-leads" ADD COLUMN IF NOT EXISTS telefonnummer TEXT`);
        await query(`ALTER TABLE "property-leads" ADD COLUMN IF NOT EXISTS objekttyp TEXT DEFAULT 'Kauf'`);
        await query(`ALTER TABLE "property-leads" ADD COLUMN IF NOT EXISTS plz TEXT`);
        await query(`ALTER TABLE "property-leads" ADD COLUMN IF NOT EXISTS ort TEXT`);
        await query(`ALTER TABLE "property-leads" ADD COLUMN IF NOT EXISTS betreut_von TEXT`);
        await query(`ALTER TABLE "property-leads" ADD COLUMN IF NOT EXISTS provision_abgeber_custom DECIMAL(12, 2)`);
        await query(`ALTER TABLE "property-leads" ADD COLUMN IF NOT EXISTS provision_kaeufer_custom DECIMAL(12, 2)`);
        await query(`ALTER TABLE "property-leads" ADD COLUMN IF NOT EXISTS kaufpreis DECIMAL(12, 2)`);
        await query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'property-leads'
                      AND column_name = 'gesamtprovision'
                ) THEN
                    EXECUTE 'UPDATE "property-leads" SET kaufpreis = ROUND(COALESCE(gesamtprovision, 0) / 0.06, 2) WHERE kaufpreis IS NULL';
                END IF;
            END $$;
        `);
        await query(`UPDATE "property-leads" SET kaufpreis = 0 WHERE kaufpreis IS NULL`);
        await query(`ALTER TABLE "property-leads" ALTER COLUMN kaufpreis SET DEFAULT 0`);
        await query(`ALTER TABLE "property-leads" ALTER COLUMN kaufpreis SET NOT NULL`);
        await query(`ALTER TABLE "property-leads" ALTER COLUMN status SET DEFAULT 'Zu vergeben'`);
        await query(`ALTER TABLE "property-leads" ALTER COLUMN tagesdatum SET DEFAULT CURRENT_DATE`);
        await query(`ALTER TABLE "property-leads" ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);

        await query(`
            UPDATE "property-leads"
            SET status = CASE
                WHEN status IN ('Übergeben', 'Ãœbergeben') THEN 'Zu vergeben'
                WHEN status = 'Kontaktiert' THEN 'Von GP kontaktiert'
                WHEN status = 'Besichtigung' THEN 'Aufgenommen'
                WHEN status = 'Verkauft' THEN 'Abschluss/Verkauf'
                WHEN status IS NULL OR TRIM(status) = '' THEN 'Zu vergeben'
                ELSE status
            END
        `);

        await query(`
            UPDATE "property-leads"
            SET status = 'Zu vergeben'
            WHERE status NOT IN (${quotedStatuses})
        `);

        await query(`
            DO $$
            DECLARE constraint_name TEXT;
            BEGIN
                FOR constraint_name IN
                    SELECT c.conname
                    FROM pg_constraint c
                    JOIN pg_class t ON t.oid = c.conrelid
                    WHERE t.relname = 'property-leads'
                      AND c.contype = 'c'
                      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
                LOOP
                    EXECUTE format('ALTER TABLE "property-leads" DROP CONSTRAINT %I', constraint_name);
                END LOOP;
            END $$;
        `);

        await query(`
            ALTER TABLE "property-leads"
            ADD CONSTRAINT property_leads_status_check
            CHECK (status IN (${quotedStatuses}))
        `);

        await query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'property-leads'
                      AND column_name = 'berechnung'
                      AND is_generated = 'NEVER'
                ) THEN
                    EXECUTE 'ALTER TABLE "property-leads" DROP COLUMN berechnung';
                END IF;
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'property-leads'
                      AND column_name = 'provision_kaeufer'
                      AND is_generated = 'NEVER'
                ) THEN
                    EXECUTE 'ALTER TABLE "property-leads" DROP COLUMN provision_kaeufer';
                END IF;
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'property-leads'
                      AND column_name = 'provision_abgeber'
                      AND is_generated = 'NEVER'
                ) THEN
                    EXECUTE 'ALTER TABLE "property-leads" DROP COLUMN provision_abgeber';
                END IF;
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'property-leads'
                      AND column_name = 'gesamtprovision'
                      AND is_generated = 'NEVER'
                ) THEN
                    EXECUTE 'ALTER TABLE "property-leads" DROP COLUMN gesamtprovision CASCADE';
                END IF;
            END $$;
        `);

        await query(`
            ALTER TABLE "property-leads"
            ADD COLUMN IF NOT EXISTS gesamtprovision DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.06) STORED
        `);
        await query(`
            ALTER TABLE "property-leads"
            ADD COLUMN IF NOT EXISTS provision_abgeber DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.03) STORED
        `);
        await query(`
            ALTER TABLE "property-leads"
            ADD COLUMN IF NOT EXISTS provision_kaeufer DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.03) STORED
        `);
        await query(`
            ALTER TABLE "property-leads"
            ADD COLUMN IF NOT EXISTS berechnung DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.06 * 0.10) STORED
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS property_notes (
                id BIGSERIAL PRIMARY KEY,
                property_id BIGINT REFERENCES "property-leads"(id) ON DELETE CASCADE,
                note_text TEXT NOT NULL,
                created_by TEXT DEFAULT 'system',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        await query(`ALTER TABLE property_notes ADD COLUMN IF NOT EXISTS note_text TEXT`);
        await query(`ALTER TABLE property_notes ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system'`);
        await query(`ALTER TABLE property_notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
        await query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'property_notes'
                      AND column_name = 'content'
                ) THEN
                    EXECUTE 'UPDATE property_notes SET note_text = COALESCE(note_text, content) WHERE note_text IS NULL';
                END IF;
            END $$;
        `);
        await query(`UPDATE property_notes SET note_text = '' WHERE note_text IS NULL`);
        await query(`
            CREATE TABLE IF NOT EXISTS external_source_replies (
                id BIGSERIAL PRIMARY KEY,
                external_source_code TEXT NOT NULL,
                reply_message TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
    })().catch((error) => {
        propertySchemaPromise = null;
        throw error;
    });

    return propertySchemaPromise;
}
