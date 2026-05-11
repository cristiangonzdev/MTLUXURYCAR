import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, preflight } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseHours(v: unknown): { ok: boolean; value: number } {
  if (v === null || v === undefined || v === "") return { ok: false, value: 0 };
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0 || n > 24) return { ok: false, value: 0 };
  // dos decimales
  return { ok: true, value: Math.round(n * 100) / 100 };
}

function parseDate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!ISO_DATE_RE.test(s)) return null;
  const d = new Date(s + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  return s;
}

function parseNote(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (t.length === 0) return null;
  if (t.length > 500) return null;
  return t;
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  const adminKey = Deno.env.get("ADMIN_KEY");
  if (!adminKey) return json(req, { error: "server misconfigured" }, 500);
  if (!(await requireAdmin(req, adminKey))) return json(req, { error: "unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json(req, { error: "server misconfigured" }, 500);
  const supabase = createClient(url, serviceKey);

  const u = new URL(req.url);

  // ── LIST ───────────────────────────────────────────────
  if (req.method === "GET") {
    const from = u.searchParams.get("from");
    const to = u.searchParams.get("to");
    const limit = Math.min(parseInt(u.searchParams.get("limit") ?? "200", 10) || 200, 1000);

    let q = supabase.from("time_entries").select("*").order("worked_on", { ascending: false });
    if (from && ISO_DATE_RE.test(from)) q = q.gte("worked_on", from);
    if (to && ISO_DATE_RE.test(to)) q = q.lte("worked_on", to);
    q = q.limit(limit);

    const { data, error } = await q;
    if (error) return json(req, { error: error.message }, 500);

    // Agregados: semana actual, mes actual, total año.
    const today = new Date();
    const dayOfWeek = today.getUTCDay() || 7; // lunes=1, domingo=7
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - (dayOfWeek - 1));
    monday.setUTCHours(0, 0, 0, 0);
    const firstOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const firstOfYear = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));

    const isoDate = (d: Date) => d.toISOString().slice(0, 10);

    const [{ data: weekData }, { data: monthData }, { data: yearData }] = await Promise.all([
      supabase.from("time_entries").select("hours").gte("worked_on", isoDate(monday)),
      supabase.from("time_entries").select("hours").gte("worked_on", isoDate(firstOfMonth)),
      supabase.from("time_entries").select("hours").gte("worked_on", isoDate(firstOfYear)),
    ]);

    const sum = (rows: { hours: number }[] | null) =>
      (rows ?? []).reduce((a, r) => a + Number(r.hours), 0);

    return json(req, {
      entries: data ?? [],
      stats: {
        week_hours: Number(sum(weekData).toFixed(2)),
        month_hours: Number(sum(monthData).toFixed(2)),
        year_hours: Number(sum(yearData).toFixed(2)),
        week_start: isoDate(monday),
      },
    });
  }

  // ── CREATE ─────────────────────────────────────────────
  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json(req, { error: "invalid json" }, 400); }

    const workedOn = parseDate(body.worked_on);
    if (!workedOn) return json(req, { error: "invalid worked_on (YYYY-MM-DD)" }, 400);
    const h = parseHours(body.hours);
    if (!h.ok) return json(req, { error: "invalid hours (0.25 - 24)" }, 400);
    const note = parseNote(body.note);
    if (body.note !== null && body.note !== undefined && note === null && typeof body.note === "string" && body.note.trim().length > 500) {
      return json(req, { error: "note too long (max 500)" }, 400);
    }

    const { data, error } = await supabase
      .from("time_entries")
      .insert({ worked_on: workedOn, hours: h.value, note })
      .select()
      .single();
    if (error) return json(req, { error: error.message }, 500);
    return json(req, { ok: true, entry: data }, 201);
  }

  // ── UPDATE ─────────────────────────────────────────────
  if (req.method === "PATCH") {
    const id = u.searchParams.get("id");
    if (!id || !UUID_RE.test(id)) return json(req, { error: "invalid id" }, 400);
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json(req, { error: "invalid json" }, 400); }

    const patch: Record<string, unknown> = {};
    if (body.worked_on !== undefined) {
      const d = parseDate(body.worked_on);
      if (!d) return json(req, { error: "invalid worked_on" }, 400);
      patch.worked_on = d;
    }
    if (body.hours !== undefined) {
      const h = parseHours(body.hours);
      if (!h.ok) return json(req, { error: "invalid hours" }, 400);
      patch.hours = h.value;
    }
    if (body.note !== undefined) {
      patch.note = body.note === null ? null : parseNote(body.note);
    }
    if (Object.keys(patch).length === 0) return json(req, { error: "nothing to update" }, 400);

    const { data, error } = await supabase
      .from("time_entries").update(patch).eq("id", id).select().single();
    if (error) return json(req, { error: error.message }, 500);
    return json(req, { ok: true, entry: data });
  }

  // ── DELETE ─────────────────────────────────────────────
  if (req.method === "DELETE") {
    const id = u.searchParams.get("id");
    if (!id || !UUID_RE.test(id)) return json(req, { error: "invalid id" }, 400);
    const { error } = await supabase.from("time_entries").delete().eq("id", id);
    if (error) return json(req, { error: error.message }, 500);
    return json(req, { ok: true });
  }

  return json(req, { error: "method not allowed" }, 405);
});
