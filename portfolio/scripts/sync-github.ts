#!/usr/bin/env node
/**
 * sync-github.ts
 * Reads portfolio.config.json, enriches each item with GitHub API metadata,
 * and writes the result to src/data/portfolio.json.
 *
 * Usage:
 *   npm run sync                          # uses unauthenticated API (60 req/hr limit)
 *   GITHUB_TOKEN=ghp_xxx npm run sync     # authenticated (5000 req/hr)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Types ─────────────────────────────────────────────────────────────────────
interface ConfigItem {
  id: number;
  githubRepo?: string;
  title: string;
  image: string;
  category: string[];
  links: { label: string; url: string }[];
  override?: Record<string, unknown>;
}

interface GitHubRepo {
  name: string;
  description: string | null;
  topics: string[];
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  html_url: string;
}

// ── GitHub API ────────────────────────────────────────────────────────────────
async function fetchRepo(repo: string): Promise<GitHubRepo | null> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!res.ok) {
      console.warn(`⚠️  GitHub API ${res.status} for ${repo}: ${await res.text()}`);
      return null;
    }
    return res.json() as Promise<GitHubRepo>;
  } catch (err) {
    console.warn(`⚠️  Network error fetching ${repo}:`, err);
    return null;
  }
}

// ── Filters (same as existing portfolio.json) ─────────────────────────────────
const FILTERS = [
  { label: "ALL", value: "all" },
  { label: "BACKEND", value: "backend" },
  { label: "FRONTEND", value: "frontend" },
  { label: "MOBILE", value: "mobile" },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const configPath = path.join(ROOT, "portfolio.config.json");
  const outputPath = path.join(ROOT, "src", "data", "portfolio.json");

  if (!fs.existsSync(configPath)) {
    console.error("❌ portfolio.config.json not found at", configPath);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as { items: ConfigItem[] };
  const output: unknown[] = [];

  for (const item of config.items) {
    let githubStats: Record<string, unknown> = {};

    if (item.githubRepo) {
      process.stdout.write(`🔍 Fetching ${item.githubRepo}... `);
      const gh = await fetchRepo(item.githubRepo);
      if (gh) {
        githubStats = {
          stars: gh.stargazers_count,
          language: gh.language,
          updatedAt: gh.updated_at,
          topics: gh.topics,
        };
        console.log(`✅ stars=${gh.stargazers_count}, lang=${gh.language}`);
      } else {
        console.log("❌ skipped");
      }
      // Respect rate limit — 100ms between requests
      await new Promise((r) => setTimeout(r, 100));
    }

    output.push({
      id: item.id,
      image: item.image,
      title: item.title,
      category: item.category,
      links: item.links,
      githubRepo: item.githubRepo,
      githubStats: Object.keys(githubStats).length ? githubStats : undefined,
      ...item.override,
    });
  }

  const result = { filters: FILTERS, items: output };
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 4), "utf-8");
  console.log(`\n✅ Written ${output.length} items → ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ Sync failed:", err);
  process.exit(1);
});
