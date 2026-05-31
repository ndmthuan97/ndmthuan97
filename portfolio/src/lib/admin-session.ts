// Client-side admin session: holds the bearer token returned by /api/login.
// No secrets live here — only a short-lived signed token issued by the server,
// plus the (non-secret) repo name and AI-enabled flag so the session survives a
// page reload without forcing a re-login.

const TOKEN_KEY = "admin_token";
const REPO_KEY = "admin_repo";
const HAS_AI_KEY = "admin_has_ai";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Decode the token's `exp` (epoch MILLISECONDS — matches the server's
 * `Date.now() + TTL`) from its base64url payload; null if unreadable.
 * Token layout is `<base64url(payload)>.<hmac>`, so the payload is part [0].
 */
function tokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** True only when a token exists AND has not expired (server enforces too). */
export function isAuthed(): boolean {
  const token = getToken();
  if (!token) return false;
  const exp = tokenExp(token);
  if (exp !== null && exp < Date.now()) {
    logout();
    return false;
  }
  return true;
}

export function getRepo(): string | undefined {
  return localStorage.getItem(REPO_KEY) ?? undefined;
}

export function hasAIConfigured(): boolean {
  return localStorage.getItem(HAS_AI_KEY) === "1";
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REPO_KEY);
  localStorage.removeItem(HAS_AI_KEY);
}

/** Exchange the admin password for a session token. */
export async function login(password: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, message: err.error ?? `Login failed (${res.status})` };
    }
    const data = (await res.json()) as { token: string; repo: string | null; hasAI: boolean };
    localStorage.setItem(TOKEN_KEY, data.token);
    if (data.repo) localStorage.setItem(REPO_KEY, data.repo);
    else localStorage.removeItem(REPO_KEY);
    localStorage.setItem(HAS_AI_KEY, data.hasAI ? "1" : "0");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error" };
  }
}

/** fetch() wrapper that attaches the bearer token; throws on 401 (expired session). */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    logout();
    throw new Error("Session expired — please log in again");
  }
  return res;
}
