-- Anade 'newsletter' al CHECK constraint de lead_type para suscripciones
-- desde el form independiente del home (sin coche concreto, sin telefono).
-- Idempotente.

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_type_chk;
ALTER TABLE leads
  ADD CONSTRAINT leads_lead_type_chk
  CHECK (lead_type IN ('inventory','advisory','newsletter'));
