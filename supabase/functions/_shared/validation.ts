// Validación mínima sin Zod. Cada función devuelve error string o null.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_RE = /^\+[1-9]\d{6,14}$/;
const INTENT_VALUES = new Set(["immediate", "short_term", "exploring"]);
const STATUS_VALUES = new Set(["new", "contacted", "qualified", "closed", "lost"]);

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
};

function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
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

  const intent = trimOrNull(r.intent);
  if (!intent || !INTENT_VALUES.has(intent)) {
    return { ok: false, error: "invalid intent" };
  }

  const vehicle_id = trimOrNull(r.vehicle_id);
  if (!vehicle_id || vehicle_id.length > 100) {
    return { ok: false, error: "vehicle_id required" };
  }

  const vehicle_name = trimOrNull(r.vehicle_name);
  let vehicle_price: number | null = null;
  if (r.vehicle_price !== null && r.vehicle_price !== undefined && r.vehicle_price !== "") {
    const n = Number(r.vehicle_price);
    if (!Number.isFinite(n) || n < 0 || n > 99_999_999) {
      return { ok: false, error: "invalid vehicle_price" };
    }
    vehicle_price = n;
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
    },
  };
}

export function validateStatus(v: unknown): string | null {
  const s = trimOrNull(v);
  if (s && STATUS_VALUES.has(s)) return s;
  return null;
}
