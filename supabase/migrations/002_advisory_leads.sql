-- Soporte de leads de asesoramiento (búsqueda de unidades).
-- Idempotente.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_type text,
  ADD COLUMN IF NOT EXISTS request_details jsonb;

UPDATE leads SET lead_type = 'inventory' WHERE lead_type IS NULL;

ALTER TABLE leads
  ALTER COLUMN lead_type SET DEFAULT 'inventory',
  ALTER COLUMN lead_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_lead_type_chk') THEN
    ALTER TABLE leads
      ADD CONSTRAINT leads_lead_type_chk
      CHECK (lead_type IN ('inventory','advisory'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS leads_lead_type_idx ON leads (lead_type);
