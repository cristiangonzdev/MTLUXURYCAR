import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, preflight } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { validateStatus } from "../_shared/validation.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "PATCH") return json(req, { error: "method not allowed" }, 405);

  const adminKey = Deno.env.get("ADMIN_KEY");
  if (!adminKey) return json(req, { error: "server misconfigured" }, 500);
  if (!(await requireAdmin(req, adminKey))) return json(req, { error: "unauthorized" }, 401);

  const u = new URL(req.url);
  const id = u.searchParams.get("id");
  if (!id || !UUID_RE.test(id)) return json(req, { error: "invalid id" }, 400);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "invalid json" }, 400);
  }

  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) {
    const s = validateStatus(body.status);
    if (!s) return json(req, { error: "invalid status" }, 400);
    patch.status = s;
  }
  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== "string") {
      return json(req, { error: "invalid notes" }, 400);
    }
    patch.notes = body.notes;
  }
  if (Object.keys(patch).length === 0) return json(req, { error: "nothing to update" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json(req, { error: "server misconfigured" }, 500);

  const supabase = createClient(url, serviceKey);
  const { data, error } = await supabase.from("leads").update(patch).eq("id", id).select().single();
  if (error) return json(req, { error: error.message }, 500);
  return json(req, { ok: true, lead: data });
});
