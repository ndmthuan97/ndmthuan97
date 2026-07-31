export type Category = "all" | "web" | "ai" | "desktop" | "mobile" | "enterprise" | "freelance";

/** How the project was undertaken — shown as a badge on the card/modal. */
export type ProjectType = "personal" | "team" | "company" | "freelance";

export interface PortfolioLink {
  label: string;
  url: string;
}

/** One "Challenges & Solutions" story: what broke, why, what was done, what came of it. */
export interface ProjectChallenge {
  title: string;
  problem: string;
  solution: string;
  result?: string;
}

export interface PortfolioItem {
  id: number;
  image: string;
  title: string;
  description: string;
  role?: string;        // e.g. "Full-Stack Developer"
  year?: string;        // e.g. "2025" or "2024 — 2025"
  projectType?: ProjectType; // "personal" | "team" | "company" | "freelance"
  hasRealUsers?: boolean; // true = deployed with real users (shows a "Real users" badge)
  demoUrl?: string;     // optional live demo link
  featured?: boolean;
  overview?: string;
  businessContext?: string;   // why the project existed; what process it replaced
  roleSummary?: string;       // team context + what this person actually owned
  responsibilities?: string[]; // only what was done directly
  highlights?: string[]; // 3–5 technical highlights; also the card's quick-scan bullets
  features?: string[];   // detailed feature list shown in the modal, user's point of view
  impact?: string[];     // outcomes / results the project produced
  challenges?: ProjectChallenge[];
  githubRepo?: string; // legacy single repo — use githubRepos when multiple
  githubRepos?: string[]; // multiple repos (e.g. separate frontend + backend)
  githubStats?: {
    stars?: number;
    language?: string;
    updatedAt?: string;
  };
  links: PortfolioLink[];
  category: Exclude<Category, "all">[];
  technologies?: {
    backend?: string[];
    frontend?: string[];
    desktop?: string[];
    mobile?: string[];
    database?: string[];
    devops?: string[];
    thirdParty?: string[];
  };
}

export interface PortfolioFilter {
  label: string;
  value: Category;
}
