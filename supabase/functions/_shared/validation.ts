// Validación mínima sin Zod. Cada función devuelve error string o null.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_RE = /^\+[1-9]\d{6,14}$/;
const INTENT_VALUES = new Set(["immediate", "short_term", "exploring"]);
const STATUS_VALUES = new Set(["new", "contacted", "qualified", "closed", "lost"]);
const LEAD_TYPE_VALUES = new Set(["inventory", "advisory"]);

const CURRENT_YEAR = new Date().getFullYear();

export type RequestDetails = {
  brand: string;
  model: string;
  year?: number | null;
  km_max?: number | null;
  color?: string | null;
  budget_max?: number | null;
};

export type LeadInput = {
  email: string;
  phone?: string | null;
  intent: string;
  vehicle_id: string;
  vehicle_name?: string | null;
  vehicle_price?: number | null;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  lead_type: string;
  request_details?: RequestDetails | null;
  newsletter_opt_in: boolean;
};

function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

function slugify(s: string): string {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseOptionalNumber(v: unknown, min: number, max: number): { ok: boolean; value: number | null } {
  if (v === null || v === undefined || v === "") return { ok: true, value: null };
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return { ok: false, value: null };
  return { ok: true, value: n };
}

function validateAdvisoryDetails(raw: unknown): { ok: true; data: RequestDetails } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "request_details required for advisory" };
  const r = raw as Record<string, unknown>;

  const brand = trimOrNull(r.brand);
  if (!brand || brand.length > 60) return { ok: false, error: "brand required" };
  const model = trimOrNull(r.model);
  if (!model || model.length > 80) return { ok: false, error: "model required" };

  const year = parseOptionalNumber(r.year, 1980, CURRENT_YEAR + 1);
  if (!year.ok) return { ok: false, error: "invalid year" };

  const kmMax = parseOptionalNumber(r.km_max, 0, 1_000_000);
  if (!kmMax.ok) return { ok: false, error: "invalid km_max" };

  const budget = parseOptionalNumber(r.budget_max, 0, 99_999_999);
  if (!budget.ok) return { ok: false, error: "invalid budget_max" };

  const color = trimOrNull(r.color);
  if (color !== null && color.length > 40) return { ok: false, error: "invalid color" };

  return {
    ok: true,
    data: { brand, model, year: year.value, km_max: kmMax.value, color, budget_max: budget.value },
  };
}

export function validateLeadInput(raw: unknown): { ok: true; data: LeadInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "body must be JSON object" };
  const r = raw as Record<string, unknown>;

  const email = trimOrNull(r.email);
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, error: "invalid email" };
  }

  const phone = trimOrNull(r.phone);
  if (phone !== null && !E164_RE.test(phone)) {
    return { ok: false, error: "phone must be E.164 (+34...)" };
  }

  const leadType_pre = trimOrNull(r.lead_type) ?? "inventory";
  if (phone === null) {
    return { ok: false, error: "phone required" };
  }

  const intent = trimOrNull(r.intent);
  if (!intent || !INTENT_VALUES.has(intent)) {
    return { ok: false, error: "invalid intent" };
  }

  const leadType = leadType_pre;
  if (!LEAD_TYPE_VALUES.has(leadType)) {
    return { ok: false, error: "invalid lead_type" };
  }

  const newsletterOptIn = r.newsletter_opt_in === true;

  let vehicle_id: string | null;
  let vehicle_name: string | null;
  let vehicle_price: number | null = null;
  let request_details: RequestDetails | null = null;

  if (leadType === "advisory") {
    const adv = validateAdvisoryDetails(r.request_details);
    if (!adv.ok) return { ok: false, error: adv.error };
    request_details = adv.data;
    vehicle_id = `advisory:${slugify(adv.data.brand)}-${slugify(adv.data.model)}`;
    vehicle_name = `${adv.data.brand} ${adv.data.model} (asesoramiento)`;
  } else {
    vehicle_id = trimOrNull(r.vehicle_id);
    if (!vehicle_id || vehicle_id.length > 100) {
      return { ok: false, error: "vehicle_id required" };
    }
    vehicle_name = trimOrNull(r.vehicle_name);
    if (r.vehicle_price !== null && r.vehicle_price !== undefined && r.vehicle_price !== "") {
      const n = Number(r.vehicle_price);
      if (!Number.isFinite(n) || n < 0 || n > 99_999_999) {
        return { ok: false, error: "invalid vehicle_price" };
      }
      vehicle_price = n;
    }
  }

  return {
    ok: true,
    data: {
      email,
      phone,
      intent,
      vehicle_id,
      vehicle_name,
      vehicle_price,
      source: trimOrNull(r.source),
      utm_source: trimOrNull(r.utm_source),
      utm_medium: trimOrNull(r.utm_medium),
      utm_campaign: trimOrNull(r.utm_campaign),
      lead_type: leadType,
      request_details,
      newsletter_opt_in: newsletterOptIn,
    },
  };
}

export function validateStatus(v: unknown): string | null {
  const s = trimOrNull(v);
  if (s && STATUS_VALUES.has(s)) return s;
  return null;
}
