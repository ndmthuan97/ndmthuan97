// AI content generation for the admin panel.
// The actual Groq/Gemini calls happen server-side (/api/ai); no API key in the bundle.
import { authedFetch, hasAIConfigured } from "../lib/admin-session";
import type { PortfolioItem } from "../types/portfolio";

/** Whether the server has at least one AI provider key configured (known after login). */
export function hasAI(): boolean {
  return hasAIConfigured();
}

export interface AIGenResult {
  description: string;
  overview: string;
  businessContext?: string;
  roleSummary?: string;
  responsibilities?: string[];
  features: string[];
  highlights?: string[];
  impact?: string[];
  technologies?: PortfolioItem["technologies"];
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
  const res = await authedFetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "project", title, hint, githubDataList, existingItems }),
    signal,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `AI generation failed (${res.status})`);
  }
  return res.json() as Promise<AIGenResult & { _provider: string }>;
}

export interface AboutGenResult {
  /** 3 paragraphs separated by blank lines — same shape as about.json's `bio`. */
  bio: string;
}

/** AI-assist the About section: returns a first-person 3-paragraph bio. */
export async function generateAbout(
  input: { hint?: string; role?: string; skills?: string; current?: string },
  signal?: AbortSignal
): Promise<AboutGenResult & { _provider: string }> {
  const res = await authedFetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "about", ...input }),
    signal,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `AI generation failed (${res.status})`);
  }
  return res.json() as Promise<AboutGenResult & { _provider: string }>;
}
