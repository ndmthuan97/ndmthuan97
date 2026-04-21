import { useState, useCallback, useRef } from "react";
import { Plus, Trash2, Edit3, X, Save, ImagePlus, Sparkles, Star, FileInput, GitCommit } from "lucide-react";
import initialData from "../../data/portfolio.json";
import type { PortfolioItem } from "../../types/portfolio";
import { assetPath } from "../../utils/asset-path";

// ─── Config ──────────────────────────────────────────────────────────────────
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_PAT as string | undefined;
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO as string | undefined;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const FILE_PATH = "portfolio/src/data/portfolio.json";
const HAS_AI = !!(GROQ_API_KEY || GEMINI_API_KEY);

// ─── AI Generate Helper (Google Gemini — free tier 1500 req/day) ──────────────
interface AIGenResult {
  description: string;
  overview: string;
  features: string[];
  technicalDetails?: {
    backend?: string[];
    frontend?: string[];
    mobile?: string[];
  };
  technologies?: {
    backend?: string[];
    frontend?: string[];
    mobile?: string[];
    thirdParty?: string[];
  };
}

type GithubRepoData = { repo: string; description?: string; language?: string; topics?: string[]; readme?: string };

interface RepoOption { full_name: string; name: string; description: string | null; type: "owner" | "contributed" }

// Fetch repos the authenticated user owns OR has contributed to.
// With token: uses /user/repos (includes private + contributed).
// Without token: falls back to /users/{owner}/repos (public only).
async function fetchUserRepos(owner: string): Promise<RepoOption[]> {
  const headers: HeadersInit = { Accept: "application/vnd.github+json" };
  if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;

  if (GITHUB_TOKEN) {
    // Authenticated: get all repos user has access to (owner + collaborator + org member)
    const res = await fetch(
      `https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100`,
      { headers }
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

  // Unauthenticated: public repos only
  const res = await fetch(
    `https://api.github.com/users/${owner}/repos?sort=updated&per_page=100`,
    { headers }
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const raw = await res.json() as { full_name: string; name: string; description: string | null }[];
  return raw.map(r => ({ full_name: r.full_name, name: r.name, description: r.description, type: "owner" as const }));
}

async function generateProjectContent(
  title: string,
  hint: string,
  githubDataList: GithubRepoData[],
  existingItems: Array<{ title: string; description: string; overview?: string; features?: string[] }>
): Promise<AIGenResult & { _provider: string }> {
  if (!GROQ_API_KEY && !GEMINI_API_KEY) throw new Error("No AI API key set (VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY)");

  const repoContext = githubDataList.map((g, i) =>
    [
      `Repo ${githubDataList.length > 1 ? i + 1 : ""} (${g.repo}):`,
      g.description ? `  Description: ${g.description}` : "",
      g.language ? `  Primary language: ${g.language}` : "",
      g.topics?.length ? `  Topics/tags: ${g.topics.join(", ")}` : "",
      g.readme ? `  README (excerpt):\n${g.readme}` : "",
    ].filter(Boolean).join("\n")
  ).join("\n\n");

  const context = [
    `Project title: ${title}`,
    hint ? `Developer hint: ${hint}` : "",
    repoContext,
  ].filter(Boolean).join("\n\n");

  // Build few-shot examples from ALL existing portfolio items
  const fewShot = existingItems
    .filter((p) => p.overview && p.features?.length)
    .slice(0, 3)
    .map((p, i) =>
      `Example ${i + 1} — ${p.title}:
description: ${JSON.stringify(p.description)}
overview: ${JSON.stringify(p.overview)}
features: ${JSON.stringify(p.features)}
technicalDetails: ${JSON.stringify((p as PortfolioItem).technicalDetails ?? {})}
technologies: ${JSON.stringify((p as PortfolioItem).technologies ?? {})}`
    )
    .join("\n\n");

  const prompt = `You are a technical writer generating portfolio content for a software developer named Thuan.
Study the EXACT writing style of these REAL portfolio entries below, then generate content for the new project that is indistinguishable in style.

STYLE RULES:
1. description — 1 crisp sentence. What it does, for whom. No filler like "This is a...".
2. overview — 2-3 sentences. First-person ("I built", "I developed"). Mention purpose, tech stack, and what makes it notable.
3. features — 5-7 strings. Format: "[emoji] [Name]: [description]". Use "\n-" for sub-points.
4. technicalDetails — object with keys "backend", "frontend", "mobile" (only include keys that apply). Each key is an array of 2-4 technical sentences describing implementation details, architecture decisions, and specific library/API usage.
5. technologies — object with keys "backend", "frontend", "mobile", "thirdParty" (only include keys that apply). Each key is an array of short tech name strings (e.g. ".NET 8", "React", "PostgreSQL", "Vercel").

--- EXISTING PORTFOLIO ENTRIES (style reference) ---
${fewShot || "(no existing entries yet — follow the style rules above)"}
--- END EXAMPLES ---

NOW GENERATE FOR THIS NEW PROJECT:
${context}

Return ONLY a valid JSON object — no markdown, no explanation:
{
  "description": "...",
  "overview": "...",
  "features": ["...", "...", "...", "...", "..."],
  "technicalDetails": {
    "backend": ["...", "..."],
    "frontend": ["...", "..."]
  },
  "technologies": {
    "backend": ["..."],
    "frontend": ["..."],
    "thirdParty": ["..."]
  }
}`;

  // ── Provider 1: Groq (Llama 4 Scout → Llama 3.3 70B) ──────────────────────
  if (GROQ_API_KEY) {
    const GROQ_MODELS = ["meta-llama/llama-4-scout-17b-16e-instruct", "llama-3.3-70b-versatile"];
    for (const model of GROQ_MODELS) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 1024,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { choices: { message: { content: string } }[] };
        const text = data.choices[0]?.message?.content ?? "";
        return { ...(JSON.parse(text) as AIGenResult), _provider: model.includes("llama-4") ? "Groq Llama 4 Scout" : "Groq Llama 3.3 70B" };
      }
      const err = await res.json() as { error?: { message?: string } };
      const msg = err.error?.message ?? `Groq error ${res.status}`;
      if (res.status !== 429 && res.status !== 503) break;
      if (!GEMINI_API_KEY) throw new Error(msg); // no fallback
    }
  }

  // ── Provider 2: Gemini fallback ───────────────────────────────────────────
  if (!GEMINI_API_KEY) throw new Error("Groq quota exceeded and no Gemini key set");
  const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
  const geminiBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1024 },
  });
  let lastError = "";
  for (const model of GEMINI_MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: geminiBody }
    );
    if (res.ok) {
      const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
      const text = data.candidates[0]?.content?.parts[0]?.text ?? "";
      return { ...(JSON.parse(text) as AIGenResult), _provider: `Gemini ${model}` };
    }
    const err = await res.json() as { error?: { message?: string } };
    lastError = err.error?.message ?? `Gemini error ${res.status}`;
    if (res.status !== 429 && res.status !== 503) break;
  }
  throw new Error(lastError);
}

// ─── Category Helper ─────────────────────────────────────────────────────────
function deriveCategory(topics: string[]): string[] {
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

// ─── GitHub Helpers ───────────────────────────────────────────────────────────
async function getFileSha(): Promise<string | null> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return null;
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) return null;
  const json = await res.json() as { sha: string };
  return json.sha;
}

async function commitToGitHub(content: string): Promise<{ ok: boolean; message: string }> {
  if (!GITHUB_TOKEN) return { ok: false, message: "VITE_GITHUB_PAT not set" };
  if (!GITHUB_REPO) return { ok: false, message: "VITE_GITHUB_REPO not set" };

  const sha = await getFileSha();
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
    }
  );
  if (!res.ok) {
    const err = await res.json() as { message: string };
    return { ok: false, message: err.message ?? res.statusText };
  }
  return { ok: true, message: "Committed successfully!" };
}

function parseRepoInput(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/github\.com\/([^/?#\s]+\/[^/?#\s]+)/);
  return match ? match[1].replace(/\.git$/, "") : trimmed;
}

async function fetchGitHubRepo(repo: string) {
  // No auth header — reading public repo metadata doesn't need the token.
  // The fine-grained PAT is scoped to the portfolio repo only, so sending it
  // here would cause a 404 for any other repo.
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Repo "${repo}" not found — check owner/repo name`);
    if (res.status === 403) throw new Error("GitHub rate limit hit — add VITE_GITHUB_PAT or try later");
    if (res.status === 401) throw new Error("GitHub token invalid");
    throw new Error(`GitHub API error ${res.status}`);
  }
  return res.json() as Promise<{ name: string; description: string | null; language: string | null; topics: string[]; stargazers_count: number; html_url: string }>;
}

// Fetch README and return plain text (base64-decoded), capped to avoid token overflow
async function fetchRepoReadme(repo: string): Promise<string | null> {
  try {
    const headers: HeadersInit = { Accept: "application/vnd.github+json" };
    if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/repos/${repo}/readme`, { headers });
    if (!res.ok) return null;
    const data = await res.json() as { content: string; encoding: string };
    if (data.encoding !== "base64") return null;
    const text = atob(data.content.replace(/\n/g, ""));
    // Strip markdown images/badges, collapse whitespace, cap at 3000 chars
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

async function uploadImageToGitHub(file: File, customName?: string): Promise<{ ok: boolean; path?: string; message: string }> {
  if (!GITHUB_TOKEN) return { ok: false, message: "VITE_GITHUB_PAT not set" };
  if (!GITHUB_REPO) return { ok: false, message: "VITE_GITHUB_REPO not set" };

  const ext = file.name.split(".").pop() ?? "png";
  const base = customName ? customName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]/gi, "-").toLowerCase() : `${Date.now()}`;
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
    }
  );

  if (!res.ok) {
    const err = await res.json() as { message: string };
    return { ok: false, message: err.message ?? res.statusText };
  }
  return { ok: true, path: `/${filename}`, message: "Uploaded!" };
}

// ─── Toast ───────────────────────────────────────────────────────────────────
type ToastMsg = { id: number; type: "success" | "error" | "info"; text: string; detail?: string };

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const push = (type: ToastMsg["type"], text: string, detail?: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, text, detail }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), type === "error" ? 6000 : 3500);
  };
  return { toasts, toast: push };
}

function ToastStack({ toasts }: { toasts: ToastMsg[] }) {
  if (!toasts.length) return null;
  const colors: Record<ToastMsg["type"], string> = {
    success: "bg-[#0d2b1a] shadow-[0_0_0_1px_rgba(74,222,128,0.25)] text-green-300",
    error:   "bg-[#2b0d0d] shadow-[0_0_0_1px_rgba(248,113,113,0.3)] text-red-300",
    info:    "bg-[#111] shadow-[0_0_0_1px_rgba(255,255,255,0.12)] text-[#ccc]",
  };
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-[8px] text-sm backdrop-blur-md ${colors[t.type]}`}
        >
          <p className="font-semibold">{t.text}</p>
          {t.detail && <p className="mt-1 text-[11px] opacity-75 leading-relaxed">{t.detail}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Item Form ───────────────────────────────────────────────────────────────
// id: 0 is the sentinel value for a new (unsaved) item
const BLANK_ITEM: PortfolioItem = {
  id: 0,
  image: "",
  title: "",
  description: "",
  overview: "",
  features: [],
  technicalDetails: {},
  links: [],
  category: [],
  technologies: {},
};

function ItemForm({
  item,
  onSave,
  onClose,
  toast,
  existingItems,
}: {
  item: PortfolioItem;
  onSave: (updated: PortfolioItem) => void;
  onClose: () => void;
  toast: (type: ToastMsg["type"], text: string, detail?: string) => void;
  existingItems: PortfolioItem[];
}) {
  // initialise repo list from existing data (support both legacy and multi)
  const initRepos = (): string[] => {
    if (item.githubRepos?.length) return item.githubRepos;
    if (item.githubRepo) return [item.githubRepo];
    return [""];
  };

  const [draft, setDraft] = useState<PortfolioItem>(item);
  const [repoInputs, setRepoInputs] = useState<string[]>(initRepos);
  const [importingIdx, setImportingIdx] = useState<number | null>(null);
  const [importError, setImportError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);
  const [repoOptions, setRepoOptions] = useState<RepoOption[]>([]);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerTab, setPickerTab] = useState<"all" | "owner" | "contributed">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const githubDataListRef = useRef<GithubRepoData[]>([]);
  // Instance-level repo cache — cleared when component unmounts
  const repoCacheRef = useRef<RepoOption[] | null>(null);
  // Pending image file — uploaded only when Save is clicked successfully
  const pendingImageRef = useRef<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string>("");

  const handleImageSelect = (file: File) => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    pendingImageRef.current = file;
    setPendingPreview(URL.createObjectURL(file));
    // Pre-fill name from file name (without extension), slugified
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
    setPendingName(base);
    setUploadError("");
  };

  const update = (field: keyof PortfolioItem, value: unknown) =>
    setDraft((d) => ({ ...d, [field]: value }));

  const handleGenerate = async (titleOverride?: string, descOverride?: string, repoDataOverride?: GithubRepoData[]) => {
    const title = (typeof titleOverride === "string" ? titleOverride : undefined) ?? draft.title;
    if (!title.trim()) return;
    setGenerating(true);
    setGenerateError("");
    try {
      const result = await generateProjectContent(
        title,
        descOverride ?? draft.description,
        repoDataOverride ?? githubDataListRef.current,
        existingItems.filter((p) => p.id !== item.id) // exclude current item being edited
      );
      setDraft((d) => ({
        ...d,
        description: result.description,
        overview: result.overview,
        features: result.features,
        ...(result.technicalDetails && { technicalDetails: result.technicalDetails }),
        ...(result.technologies && { technologies: result.technologies }),
      }));
      toast("success", `✨ Generated via ${result._provider}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI generation failed";
      setGenerateError(msg);
      // Diagnose common errors and suggest fixes
      let detail = msg;
      if (msg.includes("API_KEY") || msg.includes("API key") || msg.includes("403")) {
        detail = "Nguyên nhân: API key sai hoặc chưa có quyền.\n→ Kiểm tra VITE_GROQ_API_KEY tại console.groq.com hoặc VITE_GEMINI_API_KEY tại aistudio.google.com";
      } else if (msg.includes("quota") || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("rate_limit")) {
        detail = "Nguyên nhân: Hết quota (Groq: 500 req/ngày, Gemini: rate limit).\n→ Chờ vài phút, hệ thống sẽ tự fallback sang provider khác.";
      } else if (msg.includes("responseMimeType") || msg.includes("Cannot find field")) {
        detail = "Nguyên nhân: API version không hỗ trợ JSON mode.\n→ Đã được fix, thử lại sau khi reload trang.";
      } else if (msg.includes("model") && msg.includes("not found")) {
        detail = "Nguyên nhân: Model không tồn tại hoặc chưa được kích hoạt.\n→ Thử lại — sẽ tự fallback sang model khác.";
      } else if (msg.includes("400")) {
        detail = "Nguyên nhân: Request không hợp lệ (400).\n→ Kiểm tra nội dung prompt có ký tự đặc biệt không.";
      }
      toast("error", "⚠ AI Generate thất bại", detail);
    }
    setGenerating(false);
  };

  const handleImport = async (idx: number, repoOverride?: string, autoGenerate = false) => {
    const repo = repoOverride ?? parseRepoInput(repoInputs[idx] ?? "");
    if (!repo) return;
    setImportingIdx(idx);
    setImportError("");
    let importedTitle = "";
    let importedDesc = "";
    let importedRepoData: GithubRepoData[] = [];
    try {
      const [gh, readme] = await Promise.all([
        fetchGitHubRepo(repo),
        fetchRepoReadme(repo),
      ]);
      const newEntry: GithubRepoData = { repo, description: gh.description ?? undefined, language: gh.language ?? undefined, topics: gh.topics, readme: readme ?? undefined };
      githubDataListRef.current = [
        ...githubDataListRef.current.filter((d) => d.repo !== repo),
        newEntry,
      ];
      importedRepoData = githubDataListRef.current;
      const repos = repoInputs
        .map((r, i) => (i === idx ? repo : r))
        .filter(Boolean);
      // Capture title/desc before setDraft (avoids stale state in auto-generate)
      setDraft((d) => {
        importedTitle = d.title || gh.name;
        importedDesc = d.description || gh.description || "";
        // Derive category from topics (e.g. "react" → "frontend", "nodejs" → "backend")
        const topicCategory = deriveCategory(gh.topics ?? []);
        return {
          ...d,
          githubRepos: repos,
          githubRepo: repos[0],
          ...(idx === 0 && {
            title: importedTitle,
            description: importedDesc,
            category: d.category.length ? d.category : topicCategory as PortfolioItem["category"],
            links: d.links.length ? d.links : [{ label: "Github", url: gh.html_url }],
          }),
          ...(idx > 0 && {
            links: d.links.some((l) => l.url === gh.html_url)
              ? d.links
              : [...d.links, { label: `Github (${gh.name})`, url: gh.html_url }],
          }),
        };
      });
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed");
      setImportingIdx(null);
      return;
    }
    setImportingIdx(null);
    // Auto-generate only for primary repo when API key is set
    if (autoGenerate && idx === 0 && HAS_AI) {
      await handleGenerate(importedTitle, importedDesc, importedRepoData);
    } else if (idx === 0) {
      toast("success", `✓ Imported ${importedTitle}`);
    }
  };

  const setRepo = (idx: number, val: string) =>
    setRepoInputs((prev) => prev.map((r, i) => (i === idx ? val : r)));

  const addRepo = () => setRepoInputs((prev) => [...prev, ""]);

  const removeRepo = (idx: number) => {
    setRepoInputs((prev) => prev.filter((_, i) => i !== idx));
    githubDataListRef.current = githubDataListRef.current.filter(
      (_, i) => i !== idx
    );
  };

  const openPicker = async (idx: number) => {
    if (pickerIdx === idx) { setPickerIdx(null); return; }
    setPickerIdx(idx);
    setPickerQuery("");
    setPickerTab("all");
    if (repoCacheRef.current || loadingPicker) {
      if (repoCacheRef.current) setRepoOptions(repoCacheRef.current);
      return;
    }
    const owner = GITHUB_REPO?.split("/")[0];
    if (!owner) return;
    setLoadingPicker(true);
    try {
      const repos = await fetchUserRepos(owner);
      repoCacheRef.current = repos;
      setRepoOptions(repos);
    } catch { /* ignore */ }
    setLoadingPicker(false);
  };

  const selectRepo = (idx: number, option: RepoOption) => {
    setRepo(idx, option.full_name);
    setPickerIdx(null);
    // Auto-generate when selecting primary repo from picker
    void handleImport(idx, option.full_name, true);
  };

  const filteredRepos = repoOptions.filter((r) => {
    const matchesTab = pickerTab === "all" || r.type === pickerTab;
    const matchesQuery = !pickerQuery ||
      r.name.toLowerCase().includes(pickerQuery.toLowerCase()) ||
      r.full_name.toLowerCase().includes(pickerQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const ownedCount = repoOptions.filter(r => r.type === "owner").length;
  const contributedCount = repoOptions.filter(r => r.type === "contributed").length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full sm:max-w-5xl bg-[#111111] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_64px_rgba(0,0,0,0.7)] sm:rounded-2xl rounded-t-2xl flex flex-col" style={{ maxHeight: "95dvh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-black text-foreground">
              {item.id === 0 ? "New Project" : `Edit: ${item.title}`}
            </h2>
            {(importingIdx !== null || generating) && (
              <span className="flex items-center gap-1.5 text-xs text-[#666666]">
                <span className="w-3 h-3 rounded-full border-2 border-[#444] border-t-white animate-spin inline-block" />
                {importingIdx !== null ? "Importing..." : "Generating..."}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {HAS_AI && (
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={generating || !draft.title.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 hover:bg-white/15 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)] rounded-[6px] text-xs font-semibold motion-safe:transition-all disabled:opacity-40"
              >
                <Sparkles size={12} className={generating ? "animate-spin" : ""} />
                {generating ? "Generating..." : "AI Generate"}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-[#262626] rounded-[6px] motion-safe:transition-colors ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Responsive body: single scroll on mobile, dual-panel scroll on md+ */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden">

          {/* ── LEFT: Config panel ─────────────────────────────── */}
          <div className="md:w-68 shrink-0 md:border-r border-b md:border-b-0 border-white/8 flex flex-col md:overflow-y-auto p-4 sm:p-5 gap-5">

            {/* GitHub Repos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">GitHub Repos</span>
                <button type="button" onClick={addRepo} className="text-xs text-[#555] hover:text-white motion-safe:transition-colors flex items-center gap-1">
                  <Plus size={11} /> Add
                </button>
              </div>
              {pickerIdx !== null && (
                <div className="fixed inset-0 z-40" onClick={() => setPickerIdx(null)} />
              )}
              {repoInputs.map((repo, idx) => (
                <div key={idx} className="relative flex flex-col gap-1">
                  <div className="flex gap-1.5">
                    <input
                      value={repo}
                      onChange={(e) => { setRepo(idx, e.target.value); setPickerQuery(e.target.value); }}
                      onFocus={() => void openPicker(idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") { setPickerIdx(null); }
                        if (e.key === "Enter") { setPickerIdx(null); void handleImport(idx, undefined, idx === 0); }
                      }}
                      placeholder={idx === 0 ? "Click to browse..." : "owner/repo"}
                      className="flex-1 min-w-0 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-2.5 py-1.5 text-xs text-foreground placeholder:text-[#555] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none motion-safe:transition-all"
                    />
                    {idx > 0 && (
                      <button type="button" onClick={() => removeRepo(idx)} className="p-1.5 text-[#555] hover:text-red-400 motion-safe:transition-colors">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  {/* Picker dropdown */}
                  {pickerIdx === idx && (
                    <div className="relative z-50 bg-[#1a1a1a] shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_8px_32px_rgba(0,0,0,0.7)] rounded-[8px] overflow-hidden">
                      {!loadingPicker && repoOptions.length > 0 && (
                        <div className="flex border-b border-white/8">
                          {(["all", "owner", "contributed"] as const).map((tab) => {
                            const label = tab === "all" ? `All (${repoOptions.length})` : tab === "owner" ? `Mine (${ownedCount})` : `Fork (${contributedCount})`;
                            return (
                              <button key={tab} type="button" onClick={() => setPickerTab(tab)}
                                className={`flex-1 py-1.5 text-[10px] font-bold motion-safe:transition-colors ${pickerTab === tab ? "text-white border-b-2 border-white -mb-px" : "text-[#555] hover:text-white"}`}>
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className="max-h-48 overflow-y-auto">
                        {loadingPicker ? (
                          <p className="text-xs text-[#555] px-3 py-4 text-center">Loading...</p>
                        ) : filteredRepos.length === 0 ? (
                          <p className="text-xs text-[#555] px-3 py-4 text-center">No repos found</p>
                        ) : (
                          filteredRepos.map((r) => (
                            <button key={r.full_name} type="button" onClick={() => selectRepo(idx, r)}
                              className="w-full text-left px-3 py-2 hover:bg-white/5 motion-safe:transition-colors flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-white font-medium block truncate">{r.name}</span>
                                {r.description && <span className="text-[10px] text-[#555] truncate block">{r.description}</span>}
                              </div>
                              {r.type === "contributed" && <span className="text-[9px] px-1 py-0.5 rounded bg-white/8 text-[#777] shrink-0 mt-0.5">fork</span>}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {importError && <p className="text-red-400 text-[11px]">{importError}</p>}
            </div>

            {/* Image */}
            <div className="space-y-2">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Image</span>
              <div className="flex gap-1.5">
                <input
                  value={pendingPreview ? "(pending upload)" : draft.image}
                  onChange={(e) => {
                    // User is manually setting a path — discard any pending file upload
                    if (pendingImageRef.current) {
                      pendingImageRef.current = null;
                      if (pendingPreview) { URL.revokeObjectURL(pendingPreview); setPendingPreview(null); }
                    }
                    update("image", e.target.value);
                  }}
                  onFocus={(e) => {
                    // Allow editing when pending: clear pending state and put actual value in
                    if (pendingImageRef.current) {
                      pendingImageRef.current = null;
                      if (pendingPreview) { URL.revokeObjectURL(pendingPreview); setPendingPreview(null); }
                      e.target.value = draft.image;
                    }
                  }}
                  placeholder="/project.png"
                  className="flex-1 min-w-0 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-2.5 py-1.5 text-xs text-foreground placeholder:text-[#555] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none motion-safe:transition-all"
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] text-xs font-medium hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] motion-safe:transition-all disabled:opacity-50 shrink-0">
                  <ImagePlus size={12} />
                  {pendingPreview ? "✓ Selected" : "Select"}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); e.currentTarget.value = ""; }} />
              </div>
              {uploadError && <p className="text-red-400 text-[11px]">{uploadError}</p>}
              {/* Show pending preview (blob URL) or existing image */}
              {(pendingPreview || draft.image) && (
                <div className="relative">
                  <img
                    src={pendingPreview ?? assetPath(draft.image)}
                    alt="preview"
                    className="h-28 w-full rounded-[8px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  {pendingPreview && (
                    <span className="absolute top-1.5 right-1.5 bg-amber-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                      PENDING UPLOAD
                    </span>
                  )}
                </div>
              )}
              {/* Rename field — only shown when an image is pending */}
              {pendingPreview && pendingImageRef.current && (
                <div className="flex items-center gap-1.5">
                  <input
                    value={pendingName}
                    onChange={(e) => setPendingName(e.target.value.replace(/[^a-z0-9-_]/gi, "-").toLowerCase())}
                    placeholder="file-name (no extension)"
                    className="flex-1 min-w-0 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.12)] rounded-[6px] px-2.5 py-1.5 text-xs text-foreground font-mono placeholder:text-[#444] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none motion-safe:transition-all"
                  />
                  <span className="text-[11px] text-[#555] shrink-0">
                    .{pendingImageRef.current.name.split(".").pop()}
                  </span>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Category</span>
              <input
                defaultValue={draft.category.join(", ")}
                key={draft.category.join(",")}
                onBlur={(e) => update("category", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                placeholder="backend, frontend"
                className="w-full bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-2.5 py-1.5 text-xs text-foreground placeholder:text-[#555] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none motion-safe:transition-all"
              />
            </div>

            {/* Links */}
            <div className="space-y-2 flex-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Links (JSON)</span>
              <textarea
                value={JSON.stringify(draft.links, null, 2)}
                onChange={(e) => { try { update("links", JSON.parse(e.target.value)); } catch {} }}
                rows={7}
                className="w-full bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-2.5 py-2 text-[11px] text-foreground focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none resize-none font-mono motion-safe:transition-all"
              />
            </div>
          </div>

          {/* ── RIGHT: Content panel ────────────────────────────── */}
          <div className="flex-1 min-w-0 md:overflow-y-auto p-5 sm:p-6 space-y-5">

            {/* Title */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Title *</span>
              <input
                value={draft.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Project name"
                className="w-full bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-3 py-2.5 text-base font-semibold text-foreground placeholder:text-[#444] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none motion-safe:transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Description *</span>
              <textarea
                value={draft.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                placeholder="Short description shown on the portfolio card..."
                className="w-full bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-3 py-2.5 text-sm text-foreground placeholder:text-[#444] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none resize-none leading-relaxed motion-safe:transition-all"
              />
            </div>

            {/* Overview */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Overview</span>
              <textarea
                value={draft.overview ?? ""}
                onChange={(e) => update("overview", e.target.value)}
                rows={5}
                placeholder="Detailed overview shown in the project modal..."
                className="w-full bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-3 py-2.5 text-sm text-foreground placeholder:text-[#444] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none resize-none leading-relaxed motion-safe:transition-all"
              />
            </div>

            {/* Features */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Features <span className="normal-case font-normal text-[#555]">(one per line)</span></span>
              <textarea
                value={(draft.features ?? []).join("\n")}
                onChange={(e) => update("features", e.target.value.split("\n").filter(Boolean))}
                rows={8}
                placeholder={"🔐 Authentication: JWT-based login\n📊 Dashboard: Real-time analytics\n..."}
                className="w-full bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-3 py-2.5 text-sm text-foreground placeholder:text-[#444] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none resize-none font-mono leading-relaxed motion-safe:transition-all"
              />
            </div>

            {/* Technologies */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Technologies <span className="normal-case font-normal text-[#555]">(JSON)</span>
              </span>
              <textarea
                value={JSON.stringify(draft.technologies ?? {}, null, 2)}
                onChange={(e) => { try { update("technologies", JSON.parse(e.target.value)); } catch {} }}
                rows={6}
                className="w-full bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-3 py-2.5 text-[11px] text-foreground focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none resize-none font-mono leading-relaxed motion-safe:transition-all"
              />
            </div>

            {/* Technical Details */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Technical Details <span className="normal-case font-normal text-[#555]">(JSON)</span>
              </span>
              <textarea
                value={JSON.stringify(draft.technicalDetails ?? {}, null, 2)}
                onChange={(e) => { try { update("technicalDetails", JSON.parse(e.target.value)); } catch {} }}
                rows={8}
                className="w-full bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-3 py-2.5 text-[11px] text-foreground focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none resize-none font-mono leading-relaxed motion-safe:transition-all"
              />
            </div>

            {generateError && (
              <div className="px-3 py-2 bg-red-500/8 shadow-[0_0_0_1px_rgba(248,113,113,0.2)] rounded-[6px] text-red-400 text-xs">
                {generateError}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-white/8 shrink-0">
          <p className="text-xs text-[#444] hidden sm:block">{item.id === 0 ? "New project" : `ID: ${item.id}`}</p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button
              onClick={async () => {
                setUploading(true);
                let imagePath = draft.image;
                // Upload pending image first — only proceed if successful
                if (pendingImageRef.current) {
                  const result = await uploadImageToGitHub(pendingImageRef.current, pendingName || undefined);
                  if (!result.ok) {
                    setUploadError(result.message);
                    setUploading(false);
                    toast("error", "⚠ Image upload failed — project not saved", result.message);
                    return;
                  }
                  imagePath = result.path ?? imagePath;
                  pendingImageRef.current = null;
                  if (pendingPreview) { URL.revokeObjectURL(pendingPreview); setPendingPreview(null); }
                }
                setUploading(false);
                const repos = repoInputs.filter(Boolean);
                onSave({
                  ...draft,
                  image: imagePath,
                  id: item.id || Date.now(),
                  githubRepos: repos.length > 1 ? repos : undefined,
                  githubRepo: repos[0] ?? draft.githubRepo,
                  category: draft.category as PortfolioItem["category"],
                });
                toast(item.id === 0 ? "success" : "info", item.id === 0 ? "✓ Project created" : "✓ Changes saved");
              }}
              disabled={!draft.title.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-white/90 text-[#0a0a0a] font-bold text-sm rounded-[6px] motion-safe:transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={14} /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Main Panel ───────────────────────────────────────────────────────────────
export function AdminPanel() {
  const [items, setItems] = useState<PortfolioItem[]>(initialData.items as PortfolioItem[]);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [saving, setSaving] = useState(false);
  const { toasts, toast } = useToast();

  const handleSave = useCallback((updated: PortfolioItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
    setEditing(null);
  }, []);

  const handleDelete = (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast("info", `✓ Deleted "${title}"`);
  };

  const handleToggleFeatured = (id: number) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      const alreadyFeatured = target?.featured;
      // Only one featured at a time — clear all others
      return prev.map((i) => ({ ...i, featured: alreadyFeatured ? false : i.id === id }));
    });
    const title = items.find((i) => i.id === id)?.title ?? "";
    toast("info", alreadyFeaturedId === id ? `Unpinned "${title}"` : `⭐ "${title}" set as featured`);
  };

  const alreadyFeaturedId = items.find((i) => i.featured)?.id ?? null;

  const buildJson = () => {
    const data = { filters: initialData.filters, items };
    return JSON.stringify(data, null, 4);
  };

  const importJsonRef = useRef<HTMLInputElement>(null);

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        // Accept both { items: [...] } and a bare array
        const incoming: PortfolioItem[] = Array.isArray(raw) ? raw : (raw.items ?? []);
        if (!incoming.length) { toast("error", "JSON không hợp lệ — không tìm thấy items"); return; }
        setItems((prev) => {
          const merged = [...prev];
          for (const p of incoming) {
            const idx = merged.findIndex((x) => x.id === p.id || x.title === p.title);
            if (idx >= 0) merged[idx] = { ...merged[idx], ...p };
            else merged.unshift({ ...p, id: p.id || Date.now() + Math.random() });
          }
          return merged;
        });
        toast("success", `✓ Imported ${incoming.length} project(s) from JSON`);
      } catch {
        toast("error", "Lỗi parse JSON — kiểm tra lại định dạng file");
      }
    };
    reader.readAsText(file);
  };

  const handleCommit = async () => {
    setSaving(true);
    const result = await commitToGitHub(buildJson());
    setSaving(false);
    toast(result.ok ? "success" : "error", result.message);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground">
      {/* Top bar */}
      <div className="border-b border-white/8 bg-[#111111] sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-black text-foreground">Portfolio Admin</h1>
            <p className="text-xs text-muted-foreground">{items.length} projects</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setEditing({ ...BLANK_ITEM, id: 0 })}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-white hover:bg-white/90 text-[#0a0a0a] text-sm font-bold rounded-[6px] motion-safe:transition-all active:scale-95"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add Project</span>
            </button>
            <input
              ref={importJsonRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportJson(f); e.target.value = ""; }}
            />
            <button
              onClick={() => importJsonRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] text-sm font-medium rounded-[6px] motion-safe:transition-all"
              title="Import JSON"
            >
              <FileInput size={14} />
              <span className="hidden sm:inline">Import JSON</span>
            </button>
            <button
              onClick={handleCommit}
              disabled={saving || !GITHUB_TOKEN}
              title={!GITHUB_TOKEN ? "Set VITE_GITHUB_PAT to enable direct commit" : "Commit to GitHub"}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(74,222,128,0.4)] text-sm font-medium rounded-[6px] motion-safe:transition-all disabled:opacity-40"
            >
              <GitCommit size={14} />
              <span className="hidden sm:inline">{saving ? "Saving..." : "Commit"}</span>
            </button>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.location.hash = ""; window.location.reload(); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-2 hidden sm:block"
            >
              ← Back
            </a>
          </div>
        </div>

        {/* Status bar removed — now using ToastStack */}
      </div>

      {/* Item List */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 bg-[#111111] shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15)] rounded-xl p-3 sm:p-4 motion-safe:transition-all group"
          >
            {/* Thumbnail */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-[6px] overflow-hidden bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
              {item.image ? (
                <img src={assetPath(item.image)} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">📁</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <p className="font-bold text-foreground truncate text-sm">{item.title}</p>
                    {item.featured && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.3)] rounded font-bold uppercase tracking-wide shrink-0">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.category.map((cat) => (
                      <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.2)] font-bold uppercase">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action buttons — always visible on mobile, hover-reveal on desktop */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleFeatured(item.id)}
                    className={`p-2 rounded-[6px] motion-safe:transition-colors ${
                      item.featured
                        ? "text-amber-400 bg-amber-500/10"
                        : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    }`}
                    title={item.featured ? "Unpin from featured" : "Set as featured"}
                  >
                    <Star size={15} fill={item.featured ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => setEditing(item)}
                    className="p-2 rounded-[6px] hover:bg-[#262626] text-muted-foreground hover:text-white motion-safe:transition-colors md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-4xl mb-2">📂</p>
            <p>No projects yet. Add one above.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <ItemForm
          item={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          toast={toast}
          existingItems={items.filter((p) => p.id !== editing.id)}
        />
      )}
      <ToastStack toasts={toasts} />
    </div>
  );
}
