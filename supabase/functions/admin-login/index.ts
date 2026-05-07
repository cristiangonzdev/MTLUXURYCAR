import { json, preflight } from "../_shared/cors.ts";
import { constantTimeStringEqual, signAdminToken } from "../_shared/auth.ts";

// Pequeño retraso para mitigar password spraying.
const FAIL_DELAY_MS = 800;

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return json(req, { error: "method not allowed" }, 405);

  const adminKey = Deno.env.get("ADMIN_KEY");
  if (!adminKey) return json(req, { error: "server misconfigured" }, 500);

  let body: { password?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "invalid json" }, 400);
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!constantTimeStringEqual(password, adminKey)) {
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS));
    return json(req, { error: "unauthorized" }, 401);
  }

  const { token, expires_at } = await signAdminToken(adminKey);
  return json(req, { ok: true, token, expires_at });
});
