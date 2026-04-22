export const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_PAT as string | undefined;
export const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO as string | undefined;
export const FILE_PATH = "portfolio/src/data/portfolio.json";

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
  const headers: HeadersInit = { Accept: "application/vnd.github+json" };
  if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;

  if (GITHUB_TOKEN) {
    const res = await fetch(
      `https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100`,
      { headers, signal }
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const raw = await res.json() as { full_name: string; name: string; description: string | null; owner: { login: string } }[];
    return raw.map(r => ({
      full_name: r.full_name,
      name: r.name,
      description: r.description,
      type: r.owner.login.toLowerCase() === owner.toLowerCase() ? "owner" : "contributed",
    }));
  }

  const res = await fetch(
    `https://api.github.com/users/${owner}/repos?sort=updated&per_page=100`,
    { headers, signal }
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const raw = await res.json() as { full_name: string; name: string; description: string | null }[];
  return raw.map(r => ({ full_name: r.full_name, name: r.name, description: r.description, type: "owner" as const }));
}

export async function fetchGitHubRepo(repo: string, signal?: AbortSignal) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { Accept: "application/vnd.github+json" },
    signal,
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Repo "${repo}" not found — check owner/repo name`);
    if (res.status === 403) throw new Error("GitHub rate limit hit — add VITE_GITHUB_PAT or try later");
    if (res.status === 401) throw new Error("GitHub token invalid");
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
    const headers: HeadersInit = { Accept: "application/vnd.github+json" };
    if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/repos/${repo}/readme`, { headers, signal });
    if (!res.ok) return null;
    const data = await res.json() as { content: string; encoding: string };
    if (data.encoding !== "base64") return null;
    const text = atob(data.content.replace(/\n/g, ""));
    return text
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, "")
      .replace(/[ \t]+/g, " ")
      .trim()
      .slice(0, 3000);
  } catch {
    return null;
  }
}

async function getFileSha(signal?: AbortSignal): Promise<string | null> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return null;
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }, signal }
  );
  if (!res.ok) return null;
  const json = await res.json() as { sha: string };
  return json.sha;
}

export async function commitToGitHub(content: string, signal?: AbortSignal): Promise<{ ok: boolean; message: string }> {
  if (!GITHUB_TOKEN) return { ok: false, message: "VITE_GITHUB_PAT not set" };
  if (!GITHUB_REPO) return { ok: false, message: "VITE_GITHUB_REPO not set" };

  const sha = await getFileSha(signal);
  const body: Record<string, unknown> = {
    message: "chore: update portfolio via admin panel",
    content: btoa(encodeURIComponent(content).replace(/%([0-9A-F]{2})/gi, (_, p) => String.fromCharCode(parseInt(p, 16)))),
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    }
  );
  if (!res.ok) {
    const err = await res.json() as { message: string };
    return { ok: false, message: err.message ?? res.statusText };
  }
  return { ok: true, message: "Committed successfully!" };
}

export async function uploadImageToGitHub(
  file: File,
  customName?: string,
  signal?: AbortSignal
): Promise<{ ok: boolean; path?: string; message: string }> {
  if (!GITHUB_TOKEN) return { ok: false, message: "VITE_GITHUB_PAT not set" };
  if (!GITHUB_REPO) return { ok: false, message: "VITE_GITHUB_REPO not set" };

  const ext = file.name.split(".").pop() ?? "png";
  const base = customName
    ? customName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]/gi, "-").toLowerCase()
    : `${Date.now()}`;
  const filename = `${base}.${ext}`;
  const repoPath = `portfolio/public/${filename}`;

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${repoPath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `chore: upload project image ${filename}`,
        content: base64,
      }),
      signal,
    }
  );

  if (!res.ok) {
    const err = await res.json() as { message: string };
    return { ok: false, message: err.message ?? res.statusText };
  }
  return { ok: true, path: `/${filename}`, message: "Uploaded!" };
}
