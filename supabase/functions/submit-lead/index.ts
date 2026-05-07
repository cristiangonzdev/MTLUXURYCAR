import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, preflight } from "../_shared/cors.ts";
import { validateLeadInput } from "../_shared/validation.ts";

// Rate limit in-memory por IP. 5 req / 60s.
// TODO: migrar a Upstash Redis o KV (Supabase aún no tiene KV oficial).
// Las Edge Functions de Supabase reusan la instancia entre invocaciones,
// pero no es garantía: aceptamos best-effort.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return json(req, { error: "method not allowed" }, 405);

  const ip = getIp(req);
  if (rateLimited(ip)) return json(req, { error: "rate limited" }, 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "invalid json" }, 400);
  }

  const v = validateLeadInput(body);
  if (!v.ok) return json(req, { error: v.error }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json(req, { error: "server misconfigured" }, 500);

  const supabase = createClient(url, serviceKey);
  const { data, error } = await supabase
    .from("leads")
    .insert({
      ...v.data,
      ip: ip === "unknown" ? null : ip,
      user_agent: req.headers.get("user-agent"),
    })
    .select("id")
    .single();

  if (error) return json(req, { error: error.message }, 500);
  return json(req, { ok: true, id: data.id }, 201);
});
