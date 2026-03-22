-- Open-Akquise - Supabase Database Schema
-- Tabelle: property-leads

-- Create the properties table
CREATE TABLE IF NOT EXISTS "property-leads" (
  id BIGSERIAL PRIMARY KEY,

  -- Basis-Informationen
  link TEXT NOT NULL,
  external_id TEXT UNIQUE,

  -- Datum-Felder
  uebergeben_am DATE NOT NULL,
  tagesdatum DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Status (Dropdown)
  status TEXT NOT NULL DEFAULT 'Übergeben' CHECK (
    status IN ('Übergeben', 'Kontaktiert', 'Besichtigung', 'Vermarktung', 'Verkauft')
  ),

  -- Finanz-Daten
  gesamtprovision DECIMAL(12, 2) NOT NULL,
  berechnung DECIMAL(12, 2) GENERATED ALWAYS AS (gesamtprovision * 0.10) STORED,

  -- Notizen
  notizfeld TEXT,

  -- Tracking
  status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_external_source_Open-Akquise_status ON "property-leads"(status);
CREATE INDEX IF NOT EXISTS idx_external_source_Open-Akquise_uebergeben_am ON "property-leads"(uebergeben_am DESC);
CREATE INDEX IF NOT EXISTS idx_external_source_Open-Akquise_created_at ON "property-leads"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_source_Open-Akquise_external_id ON "property-leads"(external_id);

-- Trigger für updated_at und status_changed_at
CREATE OR REPLACE FUNCTION update_external_source_Open-Akquise_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER external_source_Open-Akquise_update_timestamp
BEFORE UPDATE ON "property-leads"
FOR EACH ROW
EXECUTE FUNCTION update_external_source_Open-Akquise_timestamp();

-- Comments für Dokumentation
COMMENT ON TABLE "property-leads" IS 'Property Management für Immobilienangebote mit automatischer Provisions-Berechnung';
COMMENT ON COLUMN "property-leads".berechnung IS 'Automatisch berechnet: 10% der Gesamtprovision';
COMMENT ON COLUMN "property-leads".status IS 'Status des Immobilienangebots im Verkaufsprozess';

