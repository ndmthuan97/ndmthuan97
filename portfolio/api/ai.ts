import { requireAuth, getBody, type VercelReq, type VercelRes } from "./_lib.js";

type GithubRepoData = {
  repo: string;
  description?: string;
  language?: string;
  topics?: string[];
  readme?: string;
};
type ExistingItem = {
  title: string;
  description: string;
  overview?: string;
  features?: string[];
  technicalDetails?: unknown;
  technologies?: unknown;
};

// ─── Prompt builders ──────────────────────────────────────────────────────────
function buildProjectPrompt(
  title: string,
  hint: string,
  githubDataList: GithubRepoData[],
  existingItems: ExistingItem[]
): string {
  const repoContext = githubDataList
    .map((g, i) =>
      [
        `Repo ${githubDataList.length > 1 ? i + 1 : ""} (${g.repo}):`,
        g.description ? `  Description: ${g.description}` : "",
        g.language ? `  Primary language: ${g.language}` : "",
        g.topics?.length ? `  Topics/tags: ${g.topics.join(", ")}` : "",
        g.readme ? `  README (excerpt):\n${g.readme}` : "",
      ].filter(Boolean).join("\n")
    )
    .join("\n\n");

  const context = [
    `Project title: ${title}`,
    hint ? `Developer hint: ${hint}` : "",
    repoContext,
  ].filter(Boolean).join("\n\n");

  const fewShot = existingItems
    .filter((p) => p.overview && p.features?.length)
    .slice(0, 3)
    .map((p, i) =>
      `Example ${i + 1} — ${p.title}:
description: ${JSON.stringify(p.description)}
overview: ${JSON.stringify(p.overview)}
features: ${JSON.stringify(p.features)}
technicalDetails: ${JSON.stringify(p.technicalDetails ?? {})}
technologies: ${JSON.stringify(p.technologies ?? {})}`
    )
    .join("\n\n");

  return `You are a technical writer generating portfolio content for a software developer named Thuan.
Study the EXACT writing style of these REAL portfolio entries below, then generate content for the new project that is indistinguishable in style.

STYLE RULES:
1. description — 1 crisp sentence. What it does, for whom. No filler like "This is a...".
2. overview — 2-3 sentences. First-person ("I built", "I developed"). Mention purpose, tech stack, and what makes it notable.
3. features — 5-7 strings. Format: "[emoji] [Name]: [description]". Use "\\n-" for sub-points.
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
  "technicalDetails": { "backend": ["...", "..."], "frontend": ["...", "..."] },
  "technologies": { "backend": ["..."], "frontend": ["..."], "thirdParty": ["..."] }
}`;
}

function buildAboutPrompt(hint: string, role: string, skills: string, current: string): string {
  return `You are a professional copywriter helping a software engineer named Thuan write the "About" section of his portfolio.

CONTEXT:
- Role: ${role || "Software Engineer"}
- Known skills/stack: ${skills || "(not provided)"}
${current ? `- Current draft (improve on this tone, don't copy verbatim):\n${current}` : ""}
${hint ? `- What Thuan wants to emphasize: ${hint}` : ""}

WRITE:
1. summary — 2 to 3 sentences, FIRST PERSON ("I'm a…", "I focus on…"). Professional, confident but not arrogant, concrete (mention real strengths/stack). No clichés like "passionate about coding", no filler like "I am a person who…". Around 45–70 words.
2. highlights — exactly 4 short strings, each a concrete strength or capability (NOT full sentences, ~6–12 words). Lead with the skill/area. Examples of the right shape: "Scalable backend systems with .NET, Clean Architecture & CQRS", "Relational & in-memory data: PostgreSQL, Redis".

Return ONLY a valid JSON object — no markdown, no explanation:
{
  "summary": "...",
  "highlights": ["...", "...", "...", "..."]
}`;
}

// ─── Provider runner (Groq → Gemini fallback) ─────────────────────────────────
type AIResult = { ok: true; data: Record<string, unknown>; provider: string } | { ok: false; status: number; error: string };

async function runAI(prompt: string): Promise<AIResult> {
  const GROQ = process.env.GROQ_API_KEY;
  const GEMINI = process.env.GEMINI_API_KEY;
  if (!GROQ && !GEMINI) return { ok: false, status: 500, error: "No AI API key set (GROQ_API_KEY or GEMINI_API_KEY)" };

  // Provider 1: Groq
  if (GROQ) {
    const models = ["meta-llama/llama-4-scout-17b-16e-instruct", "llama-3.3-70b-versatile"];
    for (const model of models) {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 1024,
        }),
      });
      if (r.ok) {
        const data = (await r.json()) as { choices: { message: { content: string } }[] };
        const text = data.choices[0]?.message?.content ?? "{}";
        return { ok: true, data: JSON.parse(text), provider: model.includes("llama-4") ? "Groq Llama 4 Scout" : "Groq Llama 3.3 70B" };
      }
      const err = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
      const msg = err.error?.message ?? `Groq error ${r.status}`;
      if (r.status !== 429 && r.status !== 503) {
        if (!GEMINI) return { ok: false, status: 502, error: msg };
        break;
      }
      if (!GEMINI) return { ok: false, status: 502, error: msg };
    }
  }

  // Provider 2: Gemini
  if (!GEMINI) return { ok: false, status: 502, error: "Groq quota exceeded and no Gemini key set" };
  const geminiModels = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
  const geminiBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1024 },
  });
  let lastError = "";
  for (const model of geminiModels) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: geminiBody }
    );
    if (r.ok) {
      const data = (await r.json()) as { candidates: { content: { parts: { text: string }[] } }[] };
      const text = data.candidates[0]?.content?.parts[0]?.text ?? "{}";
      return { ok: true, data: JSON.parse(text), provider: `Gemini ${model}` };
    }
    const err = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
    lastError = err.error?.message ?? `Gemini error ${r.status}`;
    if (r.status !== 429 && r.status !== 503) break;
  }
  return { ok: false, status: 502, error: lastError || "AI generation failed" };
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!requireAuth(req, res)) return;

  const body = await getBody<{
    mode?: "project" | "about";
    title?: string;
    hint?: string;
    githubDataList?: GithubRepoData[];
    existingItems?: ExistingItem[];
    role?: string;
    skills?: string;
    current?: string;
  }>(req);

  let prompt: string;
  if (body.mode === "about") {
    prompt = buildAboutPrompt(body.hint ?? "", body.role ?? "", body.skills ?? "", body.current ?? "");
  } else {
    if (!body.title) {
      res.status(400).json({ error: "Missing 'title'" });
      return;
    }
    prompt = buildProjectPrompt(body.title, body.hint ?? "", body.githubDataList ?? [], body.existingItems ?? []);
  }

  const result = await runAI(prompt);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(200).json({ ...result.data, _provider: result.provider });
}
