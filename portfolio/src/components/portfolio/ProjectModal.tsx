import { useEffect, useRef, useMemo } from "react";
import { X, ExternalLink, Server, Monitor, FileText, Sparkles } from "lucide-react";
import { assetPath } from "../../utils/asset-path";
import type { PortfolioItem } from "../../types/portfolio";

const TECH_BADGE_MAP: Record<string, { color: string; logo?: string; label?: string }> = {
  ".NET 8": { color: "512bd4", logo: "dotnet", label: ".NET-8.0" },
  ".NET": { color: "512bd4", logo: "dotnet" },
  "EF Core": { color: "0583cf", logo: "dotnet", label: "EF-Core" },
  "PostgreSQL": { color: "336791", logo: "postgresql" },
  "Redis": { color: "dc382d", logo: "redis" },
  "MySQL": { color: "4479a1", logo: "mysql" },
  "MongoDB": { color: "47a248", logo: "mongodb" },
  "JWT": { color: "d63aff", logo: "jsonwebtokens", label: "JWT" },
  "CQRS": { color: "e056fd", label: "CQRS" },
  "Clean Architecture": { color: "10ac84", label: "Clean-Architecture" },
  "MVVM": { color: "f368e0", label: "MVVM" },
  "Angular": { color: "dd0031", logo: "angular" },
  "React": { color: "61dafb", logo: "react", label: "React" },
  "Next.js": { color: "000000", logo: "nextdotjs" },
  "Next.js 15": { color: "000000", logo: "nextdotjs", label: "Next.js-15" },
  "TailwindCSS": { color: "06b6d4", logo: "tailwindcss" },
  "PrimeNG": { color: "ff4757", logo: "primeng", label: "PrimeNG" },
  "Kotlin": { color: "7f52ff", logo: "kotlin" },
  "Jetpack Compose": { color: "4285f4", logo: "jetpackcompose", label: "Jetpack-Compose" },
  "Retrofit": { color: "2ed573", label: "Retrofit" },
  "Azure": { color: "0078d4", logo: "microsoftazure", label: "Azure" },
  "Vercel": { color: "111111", logo: "vercel" },
  "DigitalOcean": { color: "0080ff", logo: "digitalocean" },
  "Docker": { color: "2496ed", logo: "docker" },
  "GitHub Actions": { color: "2088ff", logo: "githubactions" },
  "ChatGPT API": { color: "10a37f", logo: "openai", label: "ChatGPT" },
  "Gemini API": { color: "8e44ad", logo: "googlegemini", label: "Gemini" },
  "PayOS": { color: "00b4d8", label: "PayOS" },
  "Google Maps API": { color: "ea4335", logo: "googlemaps", label: "Google-Maps" },
  "Jira": { color: "0052cc", logo: "jira" },
  "Agile/Scrum": { color: "fd9644", label: "Agile-Scrum" },
  "Excel": { color: "217346", logo: "microsoftexcel", label: "Excel" },
  "Swagger/OpenAPI": { color: "85ea2d", logo: "swagger", label: "Swagger" },
  "Adobe Experience Manager (AEM)": { color: "eb3b5a", logo: "adobe", label: "AEM" },
  "TypeScript": { color: "3178c6", logo: "typescript" },
  "TanStack Query": { color: "ff4154", label: "TanStack-Query" },
  "Web Speech API": { color: "4285f4", label: "Web-Speech-API" },
  "OpenAI / AI SDK": { color: "10a37f", logo: "openai", label: "OpenAI" },
  "DictionaryAPI": { color: "6366f1", label: "DictionaryAPI" },
  "MyMemory Translate": { color: "22c55e", label: "MyMemory" },
  "Next.js API Routes": { color: "000000", logo: "nextdotjs", label: "Next.js-API" },
  "Node.js": { color: "339933", logo: "nodedotjs", label: "Node.js" },
};

const FALLBACK_COLORS = ["FF6B6B","4ECDC4","45B7D1","F9A826","9B59B6","3498DB","E74C3C","2ECC71","F1C40F","1ABC9C","FF9F43","00D2D3","54A0FF","5F27CD","FF4757","2ED573","FFA502","3742FA","E056FD","686DE0"];

function getBadgeUrl(tech: string): string {
  const config = TECH_BADGE_MAP[tech];
  if (config) {
    const label = encodeURIComponent(config.label ?? tech);
    const logoParam = config.logo ? `&logo=${config.logo}&logoColor=white` : "";
    return `https://img.shields.io/badge/${label}-${config.color}.svg?style=flat${logoParam}`;
  }
  let hash = 0;
  for (let i = 0; i < tech.length; i++) hash = tech.charCodeAt(i) + ((hash << 5) - hash);
  const color = FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
  return `https://img.shields.io/badge/${encodeURIComponent(tech)}-${color}.svg?style=flat&logoColor=white`;
}

function TechLabel({ tech }: { tech: string }) {
  const badgeUrl = useMemo(() => getBadgeUrl(tech), [tech]);
  return (
    <img src={badgeUrl} alt={tech} title={tech}
      className="h-5 cursor-default transition-all hover:scale-105 rounded-sm"
      loading="lazy"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

function getCategoryStyle(cat: string) {
  if (cat === "backend") return { base: "bg-blue-500 text-white", muted: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
  if (cat === "frontend") return { base: "bg-violet-500 text-white", muted: "bg-violet-500/15 text-violet-400 border-violet-500/30" };
  if (cat === "mobile") return { base: "bg-cyan-500 text-white", muted: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" };
  return { base: "bg-primary text-white", muted: "bg-primary/15 text-figma-accent border-primary/30" };
}

export function ProjectModal({ item, onClose }: { item: PortfolioItem; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape to close + focus trap
  useEffect(() => {
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const allTechs = {
    backend: item.technologies?.backend ?? [],
    frontend: item.technologies?.frontend ?? [],
    mobile: item.technologies?.mobile ?? [],
    thirdParty: item.technologies?.thirdParty ?? [],
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
      aria-label="Close modal"
    >
      <div
        id="portfolio-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-project-title"
        className="relative w-full max-w-5xl bg-figma-header rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 border border-figma-border my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-figma-card border border-figma-border text-white hover:bg-primary/20 hover:border-primary transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-5 md:p-6 border-b border-figma-border/50 flex-shrink-0">
          <div className="flex flex-col md:flex-row gap-5 items-center md:items-start text-center md:text-left">
            <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 overflow-hidden rounded-xl border-2 border-figma-border bg-figma-skill flex items-center justify-center shadow-lg">
              <img
                src={assetPath(item.image || "/default.png")}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.title) + "&background=random&color=fff&size=128";
                }}
              />
            </div>

            <div className="flex-1 space-y-2">
              <h3 id="modal-project-title" className="text-2xl md:text-3xl font-black tracking-tighter text-foreground leading-tight">
                {item.title}
              </h3>
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                {/* Category tags */}
                {item.category.map((cat) => {
                  const style = getCategoryStyle(cat);
                  const link = item.links?.find((l) =>
                    l.label.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(l.label.toLowerCase())
                  );
                  const baseClasses = "text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm";
                  if (link) {
                    return (
                      <a key={cat} href={link.url} target="_blank" rel="noopener noreferrer">
                        <span className={`${baseClasses} ${style.base} hover:opacity-90 active:scale-95`}>
                          {cat} <ExternalLink size={10} />
                        </span>
                      </a>
                    );
                  }
                  return (
                    <span key={cat} className={`${baseClasses} ${style.muted} border`}>{cat}</span>
                  );
                })}
                {/* Other links */}
                {item.links?.filter((l) =>
                  !item.category.some((cat) =>
                    l.label.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(l.label.toLowerCase())
                  )
                ).map((link, idx) => {
                  const isGithub = link.label.toLowerCase().includes("github");
                  return (
                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer">
                      <span className={`text-[9px] md:text-[10px] font-bold px-2.5 py-1 ${isGithub ? "bg-figma-skill border border-figma-border-light/50" : "bg-primary border border-primary/50"} text-white rounded-full uppercase tracking-wider flex items-center gap-1 hover:opacity-80 transition-all active:scale-95 shadow-sm`}>
                        {link.label} <ExternalLink size={10} />
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">
            {/* Left: Overview + Features */}
            <div className="md:col-span-3 space-y-6 md:border-r border-figma-border/40 md:pr-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-primary flex-shrink-0" />
                  <h6 className="text-xs font-black uppercase text-primary tracking-widest">Overview</h6>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">
                  {item.overview || item.description}
                </p>
              </div>
              {item.features && item.features.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-primary flex-shrink-0" />
                    <h6 className="text-xs font-black uppercase text-primary tracking-widest">Key Features</h6>
                  </div>
                  <ul className="space-y-3">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-muted-foreground items-start group">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0 group-hover:scale-125 group-hover:bg-primary transition-all" />
                        <span className="leading-relaxed whitespace-pre-line">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right: Tech stacks */}
            <div className="md:col-span-2 space-y-6">
              {/* Backend */}
              {(item.technicalDetails?.backend || allTechs.backend.length > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Server size={16} className="text-blue-500 flex-shrink-0" />
                    <h6 className="text-xs font-black uppercase text-blue-500 tracking-widest">Backend</h6>
                  </div>
                  {item.technicalDetails?.backend && (
                    <ul className="space-y-1.5">
                      {item.technicalDetails.backend.slice(0, 2).map((d, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground items-start">
                          <span className="w-1 h-1 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                          <span className="leading-relaxed">{d}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {allTechs.backend.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {allTechs.backend.map((tech) => <TechLabel key={tech} tech={tech} />)}
                    </div>
                  )}
                </div>
              )}

              {/* Frontend */}
              {(item.technicalDetails?.frontend || allTechs.frontend.length > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Monitor size={16} className="text-violet-500 flex-shrink-0" />
                    <h6 className="text-xs font-black uppercase text-violet-500 tracking-widest">Frontend</h6>
                  </div>
                  {item.technicalDetails?.frontend && (
                    <ul className="space-y-1.5">
                      {item.technicalDetails.frontend.slice(0, 2).map((d, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground items-start">
                          <span className="w-1 h-1 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                          <span className="leading-relaxed">{d}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {allTechs.frontend.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {allTechs.frontend.map((tech) => <TechLabel key={tech} tech={tech} />)}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile */}
              {(item.technicalDetails?.mobile || allTechs.mobile.length > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-500 text-sm font-bold">📱</span>
                    <h6 className="text-xs font-black uppercase text-cyan-500 tracking-widest">Mobile</h6>
                  </div>
                  {item.technicalDetails?.mobile && (
                    <ul className="space-y-1.5">
                      {item.technicalDetails.mobile.slice(0, 2).map((d, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground items-start">
                          <span className="w-1 h-1 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                          <span className="leading-relaxed">{d}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {allTechs.mobile.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {allTechs.mobile.map((tech) => <TechLabel key={tech} tech={tech} />)}
                    </div>
                  )}
                </div>
              )}

              {/* Third-party (NEW) */}
              {allTechs.thirdParty.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-figma-accent text-sm font-bold">🔗</span>
                    <h6 className="text-xs font-black uppercase text-figma-accent tracking-widest">Third-party</h6>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allTechs.thirdParty.map((tech) => <TechLabel key={tech} tech={tech} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
