-- Marca de consentimiento explicito para newsletter (RGPD).
-- Idempotente.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS newsletter_opt_in boolean DEFAULT false NOT NULL;

-- Indice parcial: solo indexa los que han aceptado, mucho mas pequeño y rapido
-- para extraer la lista de newsletter en el futuro.
CREATE INDEX IF NOT EXISTS leads_newsletter_optin_idx
  ON leads (created_at DESC)
  WHERE newsletter_opt_in = true;
