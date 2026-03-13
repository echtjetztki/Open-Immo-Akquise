-- Open-Akquise - Datenbank Update
-- Fügt Kaufpreis hinzu und berechnet automatisch alle Provisionen

-- WICHTIG: Dieses Script aktualisiert die bestehende Tabelle!
-- Führe dieses Script in Supabase SQL Editor aus

-- 1. Füge die neue Spalte "kaufpreis" hinzu
ALTER TABLE "property-leads"
ADD COLUMN IF NOT EXISTS kaufpreis DECIMAL(12, 2);

-- 2. Lösche die alte gesamtprovision Spalte (falls sie als normale Spalte existiert)
ALTER TABLE "property-leads"
DROP COLUMN IF EXISTS gesamtprovision CASCADE;

-- 3. Füge gesamtprovision als berechnete Spalte hinzu (6% des Kaufpreises)
ALTER TABLE "property-leads"
ADD COLUMN gesamtprovision DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.06) STORED;

-- 4. Füge provision_abgeber hinzu (3% des Kaufpreises)
ALTER TABLE "property-leads"
ADD COLUMN IF NOT EXISTS provision_abgeber DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.03) STORED;

-- 5. Füge provision_kaeufer hinzu (3% des Kaufpreises)
ALTER TABLE "property-leads"
ADD COLUMN IF NOT EXISTS provision_kaeufer DECIMAL(12, 2) GENERATED ALWAYS AS (kaufpreis * 0.03) STORED;

-- Berechnung (10% der Gesamtprovision) bleibt wie sie ist

-- Kommentare aktualisieren
COMMENT ON COLUMN "property-leads".kaufpreis IS 'Kaufpreis der Immobilie';
COMMENT ON COLUMN "property-leads".gesamtprovision IS 'Automatisch berechnet: 6% des Kaufpreises';
COMMENT ON COLUMN "property-leads".provision_abgeber IS 'Automatisch berechnet: 3% des Kaufpreises';
COMMENT ON COLUMN "property-leads".provision_kaeufer IS 'Automatisch berechnet: 3% des Kaufpreises';
COMMENT ON COLUMN "property-leads".berechnung IS 'Automatisch berechnet: 10% der Gesamtprovision';

