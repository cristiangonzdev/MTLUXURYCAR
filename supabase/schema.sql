-- MT Lux Cars · Captura de leads
-- Ejecutar en Supabase SQL Editor (proyecto del usuario).
-- Idempotente: se puede ejecutar múltiples veces sin romper nada.

-- ───────────────────────────────────────────────────────────────
-- 1. Defaults, NOT NULL y validación de la tabla `leads`
-- ───────────────────────────────────────────────────────────────

ALTER TABLE leads
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE leads
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN status SET DEFAULT 'new',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN intent SET NOT NULL,
  ALTER COLUMN vehicle_id SET NOT NULL;

-- CHOICE: CHECK constraints sobre text en vez de tipos enum de Postgres.
-- Razón: añadir un valor a un enum requiere migración; un CHECK se modifica
-- con un solo ALTER y no bloquea despliegues.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_intent_chk') THEN
    ALTER TABLE leads
      ADD CONSTRAINT leads_intent_chk
      CHECK (intent IN ('immediate','short_term','exploring'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_status_chk') THEN
    ALTER TABLE leads
      ADD CONSTRAINT leads_status_chk
      CHECK (status IN ('new','contacted','qualified','closed','lost'));
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────
-- 2. Trigger updated_at
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ───────────────────────────────────────────────────────────────
-- 3. Índices para el dashboard
-- ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
CREATE INDEX IF NOT EXISTS leads_intent_idx ON leads (intent);
CREATE INDEX IF NOT EXISTS leads_vehicle_id_idx ON leads (vehicle_id);

-- ───────────────────────────────────────────────────────────────
-- 4. Row Level Security
-- ───────────────────────────────────────────────────────────────
-- RLS completamente cerrada. Ningún rol público (anon, authenticated)
-- puede leer ni escribir directamente. Todos los accesos pasan por
-- Edge Functions usando service_role.

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Sin policies = nadie pasa, salvo service_role (que las salta por diseño).
DROP POLICY IF EXISTS "anon insert leads" ON leads;
DROP POLICY IF EXISTS "anon select leads" ON leads;
