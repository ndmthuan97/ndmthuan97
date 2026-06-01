export type Category = "all" | "web" | "ai" | "desktop" | "mobile" | "enterprise";

export type ProjectStatus = "live" | "wip" | "archived";

/** How the project was undertaken — shown as a badge on the card/modal. */
export type ProjectType = "personal" | "team" | "company" | "freelance";

export interface PortfolioLink {
  label: string;
  url: string;
}

export interface PortfolioItem {
  id: number;
  image: string;
  title: string;
  description: string;
  role?: string;        // e.g. "Full-Stack Developer"
  year?: string;        // e.g. "2025" or "2024 — 2025"
  projectType?: ProjectType; // "personal" | "team" | "company" | "freelance"
  status?: ProjectStatus; // "live" | "wip" | "archived"
  demoUrl?: string;     // optional live demo link
  featured?: boolean;
  overview?: string;
  highlights?: string[]; // 3–4 concise bullets shown on the card for quick scanning
  features?: string[];   // detailed feature list shown in the modal
  githubRepo?: string; // legacy single repo — use githubRepos when multiple
  githubRepos?: string[]; // multiple repos (e.g. separate frontend + backend)
  githubStats?: {
    stars?: number;
    language?: string;
    updatedAt?: string;
  };
  technicalDetails?: {
    backend?: string[];
    frontend?: string[];
    mobile?: string[];
  };
  links: PortfolioLink[];
  category: Exclude<Category, "all">[];
  technologies?: {
    backend?: string[];
    frontend?: string[];
    desktop?: string[];
    mobile?: string[];
    thirdParty?: string[];
  };
}

export interface PortfolioFilter {
  label: string;
  value: Category;
}
