import { useState, useMemo } from "react";
import { X, ExternalLink, Server, Monitor, FileText, Sparkles } from "lucide-react";
import portfolioData from "../data/portfolio.json";
import { useReveal } from "../hooks/use-reveal";
import { assetPath } from "../utils/asset-path";
import { Badge } from "./ui/badge";

type Category = "all" | "backend" | "frontend" | "mobile";

interface PortfolioLink {
  label: string;
  url: string;
}

interface PortfolioItem {
  id: number;
  image: string;
  title: string;
  description: string;
  overview?: string;
  features?: string[];
  technicalDetails?: {
    backend?: string[];
    frontend?: string[];
    mobile?: string[];
  };
  links: PortfolioLink[];
  category: Category[];
  technologies?: {
    backend?: string[];
    frontend?: string[];
    mobile?: string[];
    thirdParty?: string[];
  };
}

const portfolioItems: PortfolioItem[] = portfolioData.items as PortfolioItem[];
const filters: { label: string; value: Category | "all" }[] = portfolioData.filters as { label: string; value: Category | "all" }[];

// Shields.io badge config per technology: { color: hex (no #), logo: simple-icons slug }
const TECH_BADGE_MAP: Record<string, { color: string; logo?: string; label?: string }> = {
  // .NET ecosystem
  ".NET 8": { color: "512bd4", logo: "dotnet", label: ".NET-8.0" },
  ".NET": { color: "512bd4", logo: "dotnet" },
  "EF Core": { color: "0583cf", logo: "dotnet", label: "EF-Core" },
  // Databases
  "PostgreSQL": { color: "336791", logo: "postgresql" },
  "Redis": { color: "dc382d", logo: "redis" },
  "MySQL": { color: "4479a1", logo: "mysql" },
  "MongoDB": { color: "47a248", logo: "mongodb" },
  "SQLite": { color: "003b57", logo: "sqlite" },
  // Auth / Security
  "JWT": { color: "d63aff", logo: "jsonwebtokens", label: "JWT" },
  // Architecture
  "CQRS": { color: "e056fd", label: "CQRS" },
  "Clean Architecture": { color: "10ac84", label: "Clean-Architecture" },
  "MVVM": { color: "f368e0", label: "MVVM" },
  // Frontend frameworks
  "Angular": { color: "dd0031", logo: "angular" },
  "React": { color: "61dafb", logo: "react", label: "React" },
  "Vue.js": { color: "4fc08d", logo: "vuedotjs" },
  "Next.js": { color: "000000", logo: "nextdotjs" },
  "Vite": { color: "646cff", logo: "vite" },
  // CSS
  "TailwindCSS": { color: "06b6d4", logo: "tailwindcss" },
  "PrimeNG": { color: "ff4757", logo: "primeng", label: "PrimeNG" },
  // Mobile
  "Kotlin": { color: "7f52ff", logo: "kotlin" },
  "Jetpack Compose": { color: "4285f4", logo: "jetpackcompose", label: "Jetpack-Compose" },
  "Retrofit": { color: "2ed573", label: "Retrofit" },
  "Android": { color: "34a853", logo: "android" },
  "Flutter": { color: "02569b", logo: "flutter" },
  "Swift": { color: "f05138", logo: "swift" },
  // Cloud / DevOps
  "Azure": { color: "0078d4", logo: "microsoftazure", label: "Azure" },
  "Vercel": { color: "111111", logo: "vercel" },
  "DigitalOcean": { color: "0080ff", logo: "digitalocean" },
  "Docker": { color: "2496ed", logo: "docker" },
  "GitHub Actions": { color: "2088ff", logo: "githubactions" },
  // AI / APIs
  "ChatGPT API": { color: "10a37f", logo: "openai", label: "ChatGPT" },
  "Gemini API": { color: "8e44ad", logo: "googlegemini", label: "Gemini" },
  "PayOS": { color: "00b4d8", label: "PayOS" },
  "Google Maps API": { color: "ea4335", logo: "googlemaps", label: "Google Maps" },
  // Project mgmt / tools
  "Jira": { color: "0052cc", logo: "jira" },
  "Agile/Scrum": { color: "fd9644", label: "Agile-Scrum" },
  "Excel": { color: "217346", logo: "microsoftexcel", label: "Excel" },
  "Swagger/OpenAPI": { color: "85ea2d", logo: "swagger", label: "Swagger" },
  "Adobe Experience Manager (AEM)": { color: "eb3b5a", logo: "adobe", label: "AEM" },
};

// Fallback palette – deterministic color from tech string
const FALLBACK_COLORS = [
  "FF6B6B", "4ECDC4", "45B7D1", "F9A826", "9B59B6",
  "3498DB", "E74C3C", "2ECC71", "F1C40F", "1ABC9C",
  "FF9F43", "00D2D3", "54A0FF", "5F27CD", "FF4757",
  "2ED573", "FFA502", "3742FA", "E056FD", "686DE0"
];

function getBadgeUrl(tech: string): string {
  const config = TECH_BADGE_MAP[tech];
  if (config) {
    const label = encodeURIComponent(config.label ?? tech);
    const color = config.color;
    const logoParam = config.logo ? `&logo=${config.logo}&logoColor=white` : "";
    return `https://img.shields.io/badge/${label}-${color}.svg?style=flat${logoParam}`;
  }
  // Fallback: deterministic color, no logo
  let hash = 0;
  for (let i = 0; i < tech.length; i++) {
    hash = tech.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
  const label = encodeURIComponent(tech);
  return `https://img.shields.io/badge/${label}-${color}.svg?style=flat&logoColor=white`;
}

function TechLabel({ tech }: { tech: string }) {
  const badgeUrl = useMemo(() => getBadgeUrl(tech), [tech]);
  return (
    <img
      src={badgeUrl}
      alt={tech}
      title={tech}
      className="h-5 cursor-default transition-all hover:scale-105 hover:shadow-md rounded-sm"
      loading="lazy"
    />
  );
}

export function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState<Category | "all">("all");
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);
  const { isVisible, ref } = useReveal(0.05);

  const filteredItems =
    activeFilter === "all"
      ? portfolioItems
      : portfolioItems.filter((item) => item.category.includes(activeFilter));

  return (
    <section id="portfolio" ref={ref} className="min-h-screen flex items-center py-20 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2 animate-pulse delay-1000"></div>

      <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        {/* Header */}
        <div className={`text-center mb-12 relative transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl md:text-8xl font-bold text-muted/30 uppercase tracking-widest select-none">
            WORKS
          </span>
          <h2 className="relative text-3xl md:text-4xl font-bold">
            <span className="text-foreground">MY </span>
            <span className="text-primary">PORTFOLIO</span>
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-12">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-5 py-2 rounded-xl text-xs font-bold tracking-widest transition-all uppercase border ${
                activeFilter === filter.value
                  ? filter.value === "all" ? "bg-primary text-white border-primary shadow-[0_0_16px_rgba(118,60,172,0.4)]" :
                    filter.value === "backend" ? "bg-blue-600 text-white border-blue-600 shadow-[0_0_16px_rgba(37,99,235,0.4)]" :
                    filter.value === "frontend" ? "bg-green-600 text-white border-green-600 shadow-[0_0_16px_rgba(22,163,74,0.4)]" :
                    filter.value === "mobile" ? "bg-orange-500 text-white border-orange-500 shadow-[0_0_16px_rgba(249,115,22,0.4)]" :
                    "bg-primary text-white border-primary"
                  : "bg-figma-skill text-muted-foreground border-figma-border/50 hover:text-primary hover:border-figma-border-light"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setSelectedProject(item)}
              className={`group relative overflow-hidden rounded-xl cursor-pointer border border-figma-border/40 bg-figma-card/80 hover:border-figma-border-light/70 hover:shadow-[0_0_24px_rgba(118,60,172,0.25)] transition-all duration-300 ${isVisible ? "animate-in fade-in slide-in-from-bottom duration-500 fill-mode-backwards" : "opacity-0"}`}
              style={{ animationDelay: isVisible ? `${index * 100}ms` : '0ms' }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={assetPath(item.image || "/default.png")}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-figma-bg/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white font-medium tracking-wide px-4 py-2 border border-figma-border-light/60 rounded-full bg-figma-card/50 backdrop-blur-sm">
                    View Details
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {item.category.map((cat) => {
                    const isBackend = cat.toLowerCase() === "backend";
                    const isFrontend = cat.toLowerCase() === "frontend";
                    const isMobile = cat.toLowerCase() === "mobile";
                    const variant = isBackend ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                      isFrontend ? "bg-green-500/15 text-green-400 border-green-500/30" :
                      isMobile ? "bg-orange-500/15 text-orange-400 border-orange-500/30" :
                      "bg-primary/15 text-figma-accent border-primary/30";
                    return (
                      <Badge key={cat} variant="outline" className={`text-[10px] font-bold uppercase tracking-wide ${variant}`}>
                        {cat}
                      </Badge>
                    );
                  })}
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div
            className="relative w-full max-w-5xl bg-figma-header rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-figma-border my-auto flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-figma-card border border-figma-border text-white hover:bg-primary/20 hover:border-primary transition-colors"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-figma-border/50 flex-shrink-0">
              <div className="flex flex-col md:flex-row gap-5 items-center md:items-start text-center md:text-left">
                <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 overflow-hidden rounded-xl border-2 border-figma-border bg-figma-skill flex items-center justify-center shadow-lg">
                  <img
                    src={assetPath(selectedProject.image || "/default.png")}
                    alt={selectedProject.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://ui-avatars.com/api/?name=" +
                        encodeURIComponent(selectedProject.title) +
                        "&background=random&color=fff&size=128";
                    }}
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground leading-tight">
                    {selectedProject.title}
                  </h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                    {/* Category tags — linked if a matching link exists */}
                    {selectedProject.category.map((cat) => {
                      const link = selectedProject.links?.find(
                        (l) =>
                          l.label.toLowerCase().includes(cat.toLowerCase()) ||
                          cat.toLowerCase().includes(l.label.toLowerCase())
                      );
                      const isBackend = cat.toLowerCase() === "backend";
                      const isFrontend = cat.toLowerCase() === "frontend";
                      const isMobile = cat.toLowerCase() === "mobile";
                      const baseClasses =
                        "text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm";

                      if (link) {
                        const colorClass = isBackend
                          ? "bg-blue-500"
                          : isFrontend
                            ? "bg-green-500"
                            : isMobile
                              ? "bg-orange-500"
                              : "bg-primary";
                        return (
                          <a key={cat} href={link.url} target="_blank" rel="noopener noreferrer">
                            <span className={`${baseClasses} ${colorClass} text-white hover:opacity-90 active:scale-95`}>
                              {cat} <ExternalLink size={10} />
                            </span>
                          </a>
                        );
                      }

                      const colorClass = isBackend
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        : isFrontend
                          ? "bg-green-500/15 text-green-400 border border-green-500/30"
                          : isMobile
                            ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                            : "bg-primary/15 text-figma-accent border border-primary/30";
                      return (
                        <span key={cat} className={`${baseClasses} ${colorClass}`}>
                          {cat}
                        </span>
                      );
                    })}

                    {/* Other links not matching any category */}
                    {selectedProject.links
                      ?.filter(
                        (l) =>
                          !selectedProject.category.some(
                            (cat) =>
                              l.label.toLowerCase().includes(cat.toLowerCase()) ||
                              cat.toLowerCase().includes(l.label.toLowerCase())
                          )
                      )
                      .map((link, idx) => {
                        const isGithub = link.label.toLowerCase().includes("github");
                        return (
                          <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer">
                            <span
                              className={`text-[9px] md:text-[10px] font-bold px-2.5 py-1 ${
                                isGithub ? "bg-figma-skill border border-figma-border-light/50" : "bg-primary border border-primary/50"
                              } text-white rounded-full uppercase tracking-wider flex items-center gap-1 hover:opacity-80 transition-all active:scale-95 shadow-sm`}
                            >
                              {link.label} <ExternalLink size={10} />
                            </span>
                          </a>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body — Two-column layout */}
            <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">

                {/* ── LEFT COLUMN: Overview + Key Features (wider) ── */}
                <div className="md:col-span-3 space-y-6 md:border-r border-figma-border/40 md:pr-8">
                  {/* Overview */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary flex-shrink-0" />
                      <h6 className="text-xs font-black uppercase text-primary tracking-widest">Overview</h6>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">
                      {selectedProject.overview || selectedProject.description}
                    </p>
                  </div>

                  {/* Key Features — explicitly defined in JSON */}
                  {selectedProject.features && selectedProject.features.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-primary flex-shrink-0" />
                        <h6 className="text-xs font-black uppercase text-primary tracking-widest">Key Features</h6>
                      </div>
                      <ul className="space-y-3">
                        {selectedProject.features.map((feature, i) => (
                          <li key={i} className="flex gap-2.5 text-sm text-muted-foreground items-start group">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0 group-hover:scale-125 group-hover:bg-primary transition-all"></span>
                            <span className="leading-relaxed whitespace-pre-line">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* ── RIGHT COLUMN: Backend + Frontend tech sections (narrower) ── */}
                <div className="md:col-span-2 space-y-6">
                  {/* Backend */}
                  {(selectedProject.technicalDetails?.backend || selectedProject.technologies?.backend) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Server size={16} className="text-blue-500 flex-shrink-0" />
                        <h6 className="text-xs font-black uppercase text-blue-500 tracking-widest">Backend</h6>
                      </div>

                      {selectedProject.technicalDetails?.backend && (
                        <ul className="space-y-1.5">
                          {selectedProject.technicalDetails.backend.slice(0, 2).map((item, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground items-start">
                              <span className="w-1 h-1 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {selectedProject.technologies?.backend && selectedProject.technologies.backend.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedProject.technologies.backend.map((tech) => (
                            <TechLabel key={tech} tech={tech} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Frontend */}
                  {(selectedProject.technicalDetails?.frontend || selectedProject.technologies?.frontend) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Monitor size={16} className="text-green-500 flex-shrink-0" />
                        <h6 className="text-xs font-black uppercase text-green-500 tracking-widest">Frontend</h6>
                      </div>

                      {selectedProject.technicalDetails?.frontend && (
                        <ul className="space-y-1.5">
                          {selectedProject.technicalDetails.frontend.slice(0, 2).map((item, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground items-start">
                              <span className="w-1 h-1 rounded-full bg-green-400 mt-2 flex-shrink-0"></span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {selectedProject.technologies?.frontend && selectedProject.technologies.frontend.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedProject.technologies.frontend.map((tech) => (
                            <TechLabel key={tech} tech={tech} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mobile (if exists) */}
                  {(selectedProject.technicalDetails?.mobile || selectedProject.technologies?.mobile) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500 text-sm font-bold">📱</span>
                        <h6 className="text-xs font-black uppercase text-orange-500 tracking-widest">Mobile</h6>
                      </div>

                      {selectedProject.technicalDetails?.mobile && (
                        <ul className="space-y-1.5">
                          {selectedProject.technicalDetails.mobile.slice(0, 2).map((item, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground items-start">
                              <span className="w-1 h-1 rounded-full bg-orange-400 mt-2 flex-shrink-0"></span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {selectedProject.technologies?.mobile && selectedProject.technologies.mobile.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedProject.technologies.mobile.map((tech) => (
                            <TechLabel key={tech} tech={tech} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Backdrop Click to Close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setSelectedProject(null)}
          />
        </div>
      )}
    </section>
  );
}
