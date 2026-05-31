// GitHub operations for the admin panel.
// All network calls now go through the authenticated backend at /api/*,
// so the GitHub PAT never reaches the browser bundle.
import { authedFetch, getRepo } from "../lib/admin-session";

export { getRepo as GITHUB_REPO_FN };

export type GithubRepoData = {
  repo: string;
  description?: string;
  language?: string;
  topics?: string[];
  readme?: string;
};

export interface RepoOption {
  full_name: string;
  name: string;
  description: string | null;
  type: "owner" | "contributed";
}

export function parseRepoInput(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/github\.com\/([^/?#\s]+\/[^/?#\s]+)/);
  return match ? match[1].replace(/\.git$/, "") : trimmed;
}

export function deriveCategory(topics: string[]): string[] {
  const t = topics.map((s) => s.toLowerCase());
  const cats: string[] = [];
  const frontend = ["react", "vue", "angular", "nextjs", "next-js", "svelte", "tailwind", "css", "html", "frontend", "vite", "typescript", "javascript"];
  const backend  = ["nodejs", "node-js", "express", "fastapi", "django", "flask", "spring", "laravel", "backend", "api", "rest", "graphql", "nestjs", "dotnet"];
  const mobile   = ["android", "ios", "flutter", "react-native", "mobile", "expo", "swift", "kotlin"];
  const devops   = ["docker", "kubernetes", "ci-cd", "github-actions", "terraform", "aws", "azure", "gcp", "devops", "pipeline"];
  const ai       = ["ai", "ml", "machine-learning", "deep-learning", "llm", "openai", "pytorch", "tensorflow", "langchain"];
  if (t.some((x) => frontend.includes(x))) cats.push("frontend");
  if (t.some((x) => backend.includes(x)))  cats.push("backend");
  if (t.some((x) => mobile.includes(x)))   cats.push("mobile");
  if (t.some((x) => devops.includes(x)))   cats.push("devops");
  if (t.some((x) => ai.includes(x)))       cats.push("ai");
  if (cats.includes("frontend") && cats.includes("backend") && !cats.includes("fullstack")) cats.push("fullstack");
  return cats.length ? cats : ["backend", "frontend"];
}

export async function fetchUserRepos(owner: string, signal?: AbortSignal): Promise<RepoOption[]> {
  const res = await authedFetch(`/api/repos?owner=${encodeURIComponent(owner)}`, { signal });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = (await res.json()) as { repos: RepoOption[] };
  return data.repos;
}

export async function fetchGitHubRepo(repo: string, signal?: AbortSignal) {
  const res = await authedFetch(`/api/repo?repo=${encodeURIComponent(repo)}&part=info`, { signal });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Repo "${repo}" not found — check owner/repo name`);
    if (res.status === 403) throw new Error("GitHub rate limit hit — try again later");
    if (res.status === 401) throw new Error("Session expired — log in again");
    throw new Error(`GitHub API error ${res.status}`);
  }
  return res.json() as Promise<{
    name: string;
    description: string | null;
    language: string | null;
    topics: string[];
    stargazers_count: number;
    html_url: string;
  }>;
}

export async function fetchRepoReadme(repo: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await authedFetch(`/api/repo?repo=${encodeURIComponent(repo)}&part=readme`, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { readme: string | null };
    return data.readme;
  } catch {
    return null;
  }
}

/** Commit JSON to a whitelisted data file. `file` defaults to "portfolio". */
export async function commitToGitHub(
  content: string,
  file: string = "projects",
  signal?: AbortSignal
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await authedFetch("/api/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, file }),
      signal,
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
    return { ok: !!data.ok, message: data.message ?? (res.ok ? "Committed" : `Error ${res.status}`) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Commit failed" };
  }
}

export async function uploadImageToGitHub(
  file: File,
  customName?: string,
  signal?: AbortSignal
): Promise<{ ok: boolean; path?: string; message: string }> {
  const ext = file.name.split(".").pop() ?? "png";
  const base = customName
    ? customName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]/gi, "-").toLowerCase()
    : `${Date.now()}`;
  const filename = `${base}.${ext}`;

  const contentBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try {
    const res = await authedFetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, contentBase64 }),
      signal,
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; path?: string; message?: string };
    return { ok: !!data.ok, path: data.path, message: data.message ?? (res.ok ? "Uploaded" : `Error ${res.status}`) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Upload failed" };
  }
}
