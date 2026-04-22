import type { PortfolioItem } from "../types/portfolio";

export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
export const HAS_AI = !!(GROQ_API_KEY || GEMINI_API_KEY);

export interface AIGenResult {
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

type GithubRepoData = {
  repo: string;
  description?: string;
  language?: string;
  topics?: string[];
  readme?: string;
};

export async function generateProjectContent(
  title: string,
  hint: string,
  githubDataList: GithubRepoData[],
  existingItems: Array<{ title: string; description: string; overview?: string; features?: string[] }>,
  signal?: AbortSignal
): Promise<AIGenResult & { _provider: string }> {
  if (!GROQ_API_KEY && !GEMINI_API_KEY) {
    throw new Error("No AI API key set (VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY)");
  }

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

  // Provider 1: Groq (Llama 4 Scout → Llama 3.3 70B)
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
        signal,
      });
      if (res.ok) {
        const data = await res.json() as { choices: { message: { content: string } }[] };
        const text = data.choices[0]?.message?.content ?? "";
        return {
          ...(JSON.parse(text) as AIGenResult),
          _provider: model.includes("llama-4") ? "Groq Llama 4 Scout" : "Groq Llama 3.3 70B",
        };
      }
      const err = await res.json() as { error?: { message?: string } };
      const msg = err.error?.message ?? `Groq error ${res.status}`;
      if (res.status !== 429 && res.status !== 503) break;
      if (!GEMINI_API_KEY) throw new Error(msg);
    }
  }

  // Provider 2: Gemini fallback
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
      { method: "POST", headers: { "Content-Type": "application/json" }, body: geminiBody, signal }
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
