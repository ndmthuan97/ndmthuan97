import type { PortfolioItem, ProjectType } from "../types/portfolio";

// ─────────────────────────────────────────────────────────────────────────────
// Project type — how the project was undertaken (personal / team / company / freelance)
// ─────────────────────────────────────────────────────────────────────────────
/** Display label + soft pill classes for each project type. `icon` is a Lucide name. */
const PROJECT_TYPE_META: Record<ProjectType, { label: string; icon: string; badge: string }> = {
  personal:  { label: "Personal", icon: "User",      badge: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 ring-1 ring-indigo-500/20" },
  team:      { label: "Team",     icon: "Users",     badge: "text-amber-600 dark:text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/20" },
  company:   { label: "Company",  icon: "Briefcase", badge: "text-sky-600 dark:text-sky-400 bg-sky-500/10 ring-1 ring-sky-500/20" },
  freelance: { label: "Freelance", icon: "Clock",    badge: "text-teal-600 dark:text-teal-400 bg-teal-500/10 ring-1 ring-teal-500/20" },
};

/** Resolve a project type to its {label, icon, badge}; returns null for unknown/missing. */
export function projectTypeMeta(type?: string): { label: string; icon: string; badge: string } | null {
  if (!type) return null;
  return PROJECT_TYPE_META[type as ProjectType] ?? null;
}

/** Per-category color sets. `base` = solid pill (modal links), `muted` = soft pill (cards/badges). */
const CATEGORY_STYLES: Record<string, { base: string; muted: string }> = {
  web:        { base: "bg-blue-500 text-white",    muted: "text-blue-600 dark:text-blue-400 bg-blue-500/10 ring-1 ring-blue-500/20" },
  ai:         { base: "bg-emerald-500 text-white", muted: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/20" },
  desktop:    { base: "bg-rose-500 text-white",    muted: "text-rose-600 dark:text-rose-400 bg-rose-500/10 ring-1 ring-rose-500/20" },
  mobile:     { base: "bg-cyan-500 text-white",    muted: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-500/20" },
  enterprise: { base: "bg-violet-500 text-white",  muted: "text-violet-600 dark:text-violet-400 bg-violet-500/10 ring-1 ring-violet-500/20" },
  freelance:  { base: "bg-orange-500 text-white",  muted: "text-orange-600 dark:text-orange-400 bg-orange-500/10 ring-1 ring-orange-500/20" },
};

const FALLBACK = { base: "bg-foreground text-background", muted: "text-muted-foreground bg-secondary ring-line" };

/** Full {base, muted} style object for a category (used by the modal). */
export function categoryStyle(cat: string): { base: string; muted: string } {
  return CATEGORY_STYLES[cat] ?? FALLBACK;
}

/** Just the soft/muted pill classes for a category (used by cards). */
export function categoryBadgeClass(cat: string): string {
  return categoryStyle(cat).muted;
}

// ─────────────────────────────────────────────────────────────────────────────
// Card quick-scan bullets
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Bullets for the project card so visitors grasp the project at a glance.
 * Uses explicit `highlights` when provided, otherwise derives them from the
 * features — the full "Label: description" line with any leading emoji stripped
 * (the card clamps each to one line, so longer text simply fills the row).
 */
export function cardHighlights(item: PortfolioItem, max = 4): string[] {
  if (item.highlights?.length) return item.highlights.slice(0, max);
  return (item.features ?? [])
    .slice(0, max)
    .map((f) => f.replace(/^[^\p{L}\p{N}]+/u, "").replace(/:\s*/, " — ").trim())
    .filter(Boolean);
}

/**
 * Tech-icon resolver.
 * Maps each slug to an icon source. Value can be:
 *   • a domain name  → resolved via Google Favicon Service (e.g. "react.dev")
 *   • a full URL     → used directly (e.g. "https://cdn.example.com/icon.png")
 * Edit src/data/icons.json to add/change icons — both frontend and API read from it.
 * TechIcon component handles fallback to a text chip if the image fails.
 */
import ICONS from "../data/icons.json";

/** Candidate image URLs for a slug (single entry, or empty → text chip). */
export function iconSources(slug: string): string[] {
  const value = ICONS[slug];
  if (!value) return [];
  if (value.startsWith("http")) return [value];
  return [`https://www.google.com/s2/favicons?domain=${value}&sz=128`];
}

/** Deduplicated flat list of all technologies across stacks. */
export function getAllTechs(item: PortfolioItem): string[] {
  const t = item.technologies;
  if (!t) return [];
  return [...new Set([...(t.backend ?? []), ...(t.frontend ?? []), ...(t.desktop ?? []), ...(t.mobile ?? []), ...(t.thirdParty ?? [])])];
}

/**
 * Maps a tech NAME (as stored in projects.json) to an internal icon slug,
 * resolved by iconSources() (Devicon → Simple Icons → favicon → text chip).
 * Names NOT in this map are concepts/patterns without a logo (CQRS, JWT, Clean
 * Architecture, Agile…) — they are simply hidden from the icon row on cards.
 */
const TECH_ICON_SLUGS: Record<string, string> = {
  ".NET 8": "dotnet",
  ".NET": "dotnet",
  "EF Core": "dotnet",
  "C#": "cs",
  "Java": "java",
  "Spring": "spring",
  "Node.js": "nodejs",
  "Next.js": "nextjs",
  "Next.js 15": "nextjs",
  "Next.js API Routes": "nextjs",
  "React": "react",
  "Angular": "angular",
  "TypeScript": "typescript",
  "TanStack Query": "tanstack",
  "JavaScript": "js",
  "TailwindCSS": "tailwindcss",
  "Bootstrap": "bootstrap",
  "PrimeNG": "primeng",
  "PostgreSQL": "postgres",
  "MySQL": "mysql",
  "Redis": "redis",
  "SQL Server": "sqlserver",
  "MongoDB": "mongodb",
  "Kotlin": "kotlin",
  "Jetpack Compose": "androidstudio",
  "Azure": "azure",
  "AWS": "aws",
  "DigitalOcean": "digitalocean",
  "Vercel": "vercel",
  "Docker": "docker",
  "Git": "git",
  "GitHub": "github",
  "GitHub Actions": "githubactions",
  "Swagger": "swagger",
  "Postman": "postman",
  "Figma": "figma",
  "Jira": "jira",
  "ChatGPT": "openai",
  "OpenAI": "openai",
  "Gemini": "gemini",
  "Google Maps": "gmaps",
  "PayOS": "payos",
  "Adobe Experience Manager": "aem",
  "Vue": "vue",
  "Vite": "vite",
  "PrimeVue": "primevue",
  "React Native": "react",
  "Expo": "expo",
  "Firebase": "firebase",
};

export interface TechIcon {
  name: string;
  slug: string;
  srcs: string[]; // candidate image URLs; empty → render a text chip
}

/** Mapped techs as {name, slug, srcs}. Concepts without a logo entry are skipped. */
export function getTechIcons(item: PortfolioItem): TechIcon[] {
  const seen = new Set<string>();
  const out: TechIcon[] = [];
  for (const name of getAllTechs(item)) {
    const slug = TECH_ICON_SLUGS[name];
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ name, slug, srcs: iconSources(slug) });
  }
  return out;
}
