// Token de admin firmado con HMAC-SHA256.
// Formato: base64url(payload).base64url(signature)
// payload = { sub: "admin", iat: number, exp: number }

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replaceAll("-", "+").replaceAll("_", "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signAdminToken(secret: string, ttlSeconds = 60 * 60 * 24 * 7): Promise<{ token: string; expires_at: number }> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlSeconds;
  const payload = { sub: "admin", iat: now, exp };
  const payloadStr = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await hmac(secret, payloadStr);
  const token = `${payloadStr}.${b64urlEncode(sig)}`;
  return { token, expires_at: exp };
}

export async function verifyAdminToken(secret: string, token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadStr, sigStr] = parts;
  const expected = await hmac(secret, payloadStr);
  const provided = b64urlDecode(sigStr);
  if (!timingSafeEqual(expected, provided)) return false;
  try {
    const payload = JSON.parse(dec.decode(b64urlDecode(payloadStr)));
    if (payload.sub !== "admin") return false;
    if (typeof payload.exp !== "number") return false;
    if (Math.floor(Date.now() / 1000) >= payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function constantTimeStringEqual(a: string, b: string): boolean {
  return timingSafeEqual(enc.encode(a), enc.encode(b));
}

export async function requireAdmin(req: Request, secret: string): Promise<boolean> {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  return verifyAdminToken(secret, auth.slice(7));
}
