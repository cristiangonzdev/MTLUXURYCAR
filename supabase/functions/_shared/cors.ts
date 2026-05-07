const ALLOWED_ORIGINS = new Set([
  "https://www.mtluxcars.com",
  "https://mtluxcars.com",
  "http://localhost",
  "http://127.0.0.1",
]);

function isAllowed(origin: string | null): string | null {
  if (!origin) return null;
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  // localhost con cualquier puerto
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  // Vercel preview/prod deploys del proyecto (cualquier hash + team logika-digital)
  if (/^https:\/\/mtluxurycar[a-z0-9-]*\.vercel\.app$/.test(origin)) return origin;
  return null;
}

export function corsHeaders(req: Request): HeadersInit {
  const origin = isAllowed(req.headers.get("origin"));
  return {
    "Access-Control-Allow-Origin": origin ?? "https://www.mtluxcars.com",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function preflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
