// Shared GitHub REST helpers used by the serverless functions (server-side PAT).
const GH = "https://api.github.com";

function ghHeaders(): Record<string, string> {
  const pat = process.env.GITHUB_PAT;
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "portfolio-admin",
  };
  if (pat) h.Authorization = `Bearer ${pat}`;
  return h;
}

export function getRepo(): string | undefined {
  return process.env.GITHUB_REPO || undefined;
}

/** Owner allowed for read endpoints — derived from GITHUB_REPO ("owner/repo" → "owner"). */
export function allowedOwner(): string | undefined {
  return process.env.GITHUB_REPO?.split("/")[0]?.toLowerCase() || undefined;
}

/**
 * Validate an "owner/repo" string and confirm it belongs to the configured owner.
 * Prevents an authed user from using the server PAT to read arbitrary repos.
 */
export function isRepoAllowed(repo: string): boolean {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return false;
  const owner = allowedOwner();
  return !!owner && repo.split("/")[0].toLowerCase() === owner;
}

export async function getFileSha(repo: string, filePath: string): Promise<string | null> {
  const res = await fetch(`${GH}/repos/${repo}/contents/${filePath}`, { headers: ghHeaders() });
  if (!res.ok) return null;
  const json = (await res.json()) as { sha?: string };
  return json.sha ?? null;
}

export async function putFile(
  repo: string,
  filePath: string,
  contentBase64: string,
  message: string,
  sha?: string | null
): Promise<{ ok: boolean; message: string }> {
  const body: Record<string, unknown> = { message, content: contentBase64 };
  if (sha) body.sha = sha;
  const res = await fetch(`${GH}/repos/${repo}/contents/${filePath}`, {
    method: "PUT",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, message: err.message ?? res.statusText };
  }
  return { ok: true, message: "Committed successfully!" };
}

export { GH, ghHeaders };
