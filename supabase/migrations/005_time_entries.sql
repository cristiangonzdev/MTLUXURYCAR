-- Tabla independiente para registrar las horas trabajadas en MT Lux Cars.
-- Idempotente.

CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worked_on date NOT NULL,
  hours numeric(4,2) NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'time_entries_hours_chk') THEN
    ALTER TABLE time_entries
      ADD CONSTRAINT time_entries_hours_chk
      CHECK (hours > 0 AND hours <= 24);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS time_entries_worked_on_idx ON time_entries (worked_on DESC);

-- Reusamos set_updated_at() que ya existe (schema.sql).
DROP TRIGGER IF EXISTS time_entries_updated_at ON time_entries;
CREATE TRIGGER time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS cerrada. Solo se accede via Edge Function con admin token.
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
