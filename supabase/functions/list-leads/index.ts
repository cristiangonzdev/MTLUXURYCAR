import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, preflight } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "GET") return json(req, { error: "method not allowed" }, 405);

  const adminKey = Deno.env.get("ADMIN_KEY");
  if (!adminKey) return json(req, { error: "server misconfigured" }, 500);
  if (!(await requireAdmin(req, adminKey))) return json(req, { error: "unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json(req, { error: "server misconfigured" }, 500);

  const u = new URL(req.url);
  const status = u.searchParams.get("status");
  const intent = u.searchParams.get("intent");
  const leadType = u.searchParams.get("lead_type");
  const q = u.searchParams.get("q");
  const fromIso = u.searchParams.get("from");
  const limit = Math.min(parseInt(u.searchParams.get("limit") ?? "50", 10) || 50, 200);
  const offset = Math.max(parseInt(u.searchParams.get("offset") ?? "0", 10) || 0, 0);

  const supabase = createClient(url, serviceKey);

  let query = supabase.from("leads").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);
  if (intent && intent !== "all") query = query.eq("intent", intent);
  if (leadType && leadType !== "all") query = query.eq("lead_type", leadType);
  if (fromIso) query = query.gte("created_at", fromIso);
  if (q) query = query.or(`email.ilike.%${q}%,phone.ilike.%${q}%`);
  query = query.range(offset, offset + limit - 1);

  const { data: leads, error, count } = await query;
  if (error) return json(req, { error: error.message }, 500);

  // Stats: últimos 30 días
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [
    { count: total30d },
    { count: immediateUncontacted },
    { count: closed },
    { count: total },
    { data: vehicleRows },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("intent", "immediate").eq("status", "new"),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "closed"),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("vehicle_id, vehicle_name").gte("created_at", thirtyDaysAgo),
  ]);

  // top vehicle por leads en 30d
  const tally = new Map<string, { name: string | null; count: number }>();
  for (const r of vehicleRows ?? []) {
    const id = (r as { vehicle_id: string }).vehicle_id;
    const name = (r as { vehicle_name: string | null }).vehicle_name;
    const e = tally.get(id) ?? { name, count: 0 };
    e.count++;
    if (!e.name && name) e.name = name;
    tally.set(id, e);
  }
  let topVehicle: { id: string; name: string | null; count: number } | null = null;
  for (const [id, v] of tally) {
    if (!topVehicle || v.count > topVehicle.count) topVehicle = { id, name: v.name, count: v.count };
  }

  const conversionRate = (total ?? 0) === 0 ? 0 : (closed ?? 0) / (total ?? 1);

  return json(req, {
    leads: leads ?? [],
    total: count ?? 0,
    stats: {
      total_30d: total30d ?? 0,
      immediate_uncontacted: immediateUncontacted ?? 0,
      conversion_rate: Number(conversionRate.toFixed(4)),
      top_vehicle: topVehicle,
    },
  });
});
