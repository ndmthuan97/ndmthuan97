// Shared helpers for Vercel serverless functions.
// Files/folders prefixed with "_" are NOT turned into routes by Vercel.
import crypto from "node:crypto";

type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query: Record<string, string | string[] | undefined>;
};
type Res = {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: (data?: string) => void;
  setHeader: (k: string, v: string) => void;
};

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

/**
 * HMAC key for session tokens. Requires SESSION_SECRET to be set; we deliberately
 * do NOT reuse ADMIN_PASSWORD (so a leaked password can't forge tokens) and do NOT
 * fall back to a hardcoded string (which would make all tokens forgeable).
 */
function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not configured");
  return s;
}

function hmac(input: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(input).digest("base64url");
}

/** Issue a signed, expiring session token. */
export function signToken(): string {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString("base64url");
  return `${body}.${hmac(body)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const [body, mac] = token.split(".");
    if (!body || !mac) return false;
    const expected = hmac(body);
    const a = Buffer.from(mac);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    const { exp } = JSON.parse(Buffer.from(body, "base64url").toString()) as { exp: number };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Tiny in-memory fixed-window rate limiter (per warm serverless instance).
 * Not bulletproof across instances, but a meaningful brake on brute-force.
 * Returns true if the request is allowed, false if the limit is exceeded.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Req): string {
  const raw = req.headers["x-forwarded-for"];
  const val = Array.isArray(raw) ? raw[0] : raw;
  return val?.split(",")[0]?.trim() || "unknown";
}

/** Constant-time password check against ADMIN_PASSWORD (compared as SHA-256 digests). */
export function checkPassword(password: unknown): boolean {
  const admin = process.env.ADMIN_PASSWORD;
  if (!admin || typeof password !== "string") return false;
  const a = crypto.createHash("sha256").update(password).digest();
  const b = crypto.createHash("sha256").update(admin).digest();
  return crypto.timingSafeEqual(a, b);
}

/** Returns true if the request carries a valid bearer token; otherwise sends 401. */
export function requireAuth(req: Req, res: Res): boolean {
  const raw = req.headers.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  const token = header?.replace(/^Bearer\s+/i, "");
  if (!verifyToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

/** Read a JSON body whether Vercel pre-parsed it or not. */
export async function getBody<T = Record<string, unknown>>(req: Req): Promise<T> {
  if (req.body && typeof req.body === "object") return req.body as T;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body) as T; } catch { return {} as T; }
  }
  return {} as T;
}

export type { Req as VercelReq, Res as VercelRes };
