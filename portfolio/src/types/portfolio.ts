export type Category = "all" | "backend" | "frontend" | "mobile" | "service" | "migration";

export interface PortfolioLink {
  label: string;
  url: string;
}

export interface PortfolioItem {
  id: number;
  image: string;
  title: string;
  description: string;
  overview?: string;
  features?: string[];
  githubRepo?: string; // optional: "owner/repo" for auto-sync
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
    mobile?: string[];
    thirdParty?: string[];
  };
}

export interface PortfolioFilter {
  label: string;
  value: Category;
}
