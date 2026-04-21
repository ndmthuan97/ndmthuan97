import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "../ui/badge";
import { assetPath } from "../../utils/asset-path";
import type { PortfolioItem } from "../../types/portfolio";

function getCategoryStyle(cat: string) {
  if (cat === "backend")  return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (cat === "frontend") return "bg-violet-500/15 text-violet-400 border-violet-500/30";
  if (cat === "mobile")   return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  if (cat === "devops")   return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  if (cat === "ai")       return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  return "bg-white/10 text-white border-white/20";
}

function getAllTechs(item: PortfolioItem): string[] {
  const t = item.technologies;
  if (!t) return [];
  return [...new Set([...(t.backend ?? []), ...(t.frontend ?? []), ...(t.mobile ?? []), ...(t.thirdParty ?? [])])];
}

export function MasonryCard({
  item,
  index,
  isVisible,
  isFeatured,
  onSelect,
}: {
  item: PortfolioItem;
  index: number;
  isVisible: boolean;
  isFeatured: boolean;
  onSelect: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const techs = getAllTechs(item).slice(0, 5);
  const extraTechs = getAllTechs(item).length - 5;

  const baseClass = `group relative overflow-hidden rounded-xl cursor-pointer
    shadow-[0_0_0_1px_rgba(255,255,255,0.08)] bg-[#111111]/70 backdrop-blur-sm
    hover:shadow-[0_0_0_1px_rgba(255,255,255,0.22)] hover:-translate-y-0.5
    motion-safe:transition-all motion-safe:duration-300
    ${isVisible ? "animate-in fade-in slide-in-from-bottom duration-600 fill-mode-backwards" : "opacity-0"}`;

  const delay = `${Math.min(index * 80, 400)}ms`;

  if (isFeatured) {
    return (
      <article
        role="button" tabIndex={0} onClick={onSelect}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
        aria-label={`View featured project: ${item.title}`}
        className={`${baseClass} col-span-1 md:col-span-2 lg:col-span-2`}
        style={{ animationDelay: delay }}
      >
        {/* Featured badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/20 rounded-full text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Featured
          </span>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Image — taller for featured */}
          <div className="relative md:w-[52%] h-52 md:h-72 overflow-hidden bg-[#0d0d0d] flex-shrink-0">
            {!imgLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#111] via-[#1a1a1a] to-[#111]" />
            )}
            <img
              src={assetPath(item.image || "/default.png")}
              alt={item.title}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => { setImgLoaded(true); (e.target as HTMLImageElement).src = assetPath("/default.png"); }}
              className={`w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-700 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent md:to-[#111111]/80 pointer-events-none hidden md:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 to-transparent pointer-events-none md:hidden" />
          </div>

          {/* Content */}
          <div className="md:w-[48%] p-6 md:p-8 flex flex-col justify-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {item.category.map((cat) => (
                <Badge key={cat} variant="outline" className={`text-[10px] font-bold uppercase tracking-wide ${getCategoryStyle(cat)}`}>
                  {cat}
                </Badge>
              ))}
            </div>

            <div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground group-hover:text-white motion-safe:transition-colors motion-safe:duration-300 mb-2">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{item.description}</p>
            </div>

            {techs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {techs.map((tech) => (
                  <span key={tech} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] text-muted-foreground font-medium">
                    {tech}
                  </span>
                ))}
                {extraTechs > 0 && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] text-muted-foreground font-medium">
                    +{extraTechs} more
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-white text-sm font-semibold group-hover:gap-2 motion-safe:transition-all motion-safe:duration-200">
                View Details <ExternalLink size={13} />
              </span>
              {item.links.slice(0, 2).map((link) => (
                <a
                  key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-muted-foreground hover:text-white motion-safe:transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.08)] px-3 py-1 rounded-full hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // ─── Compact card ────────────────────────────────────────────────────────────
  return (
    <article
      role="button" tabIndex={0} onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      aria-label={`View project: ${item.title}`}
      className={`${baseClass} col-span-1`}
      style={{ animationDelay: delay }}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-[#0d0d0d]">
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#111] via-[#1a1a1a] to-[#111]" />
        )}
        <img
          src={assetPath(item.image || "/default.png")}
          alt={item.title}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { setImgLoaded(true); (e.target as HTMLImageElement).src = assetPath("/default.png"); }}
          className={`w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-110 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-[#0a0a0a]/65 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-300 flex items-center justify-center">
          <span className="text-white font-medium tracking-wide px-4 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] rounded-full bg-[#171717]/60 backdrop-blur-sm text-xs">
            View Details
          </span>
        </div>
        {/* Gradient bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/70 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {item.category.map((cat) => (
            <Badge key={cat} variant="outline" className={`text-[10px] font-bold uppercase tracking-wide ${getCategoryStyle(cat)}`}>
              {cat}
            </Badge>
          ))}
        </div>
        <h3 className="text-base font-bold mb-1.5 group-hover:text-white motion-safe:transition-colors leading-snug">
          {item.title}
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{item.description}</p>

        {techs.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {techs.slice(0, 3).map((tech) => (
              <span key={tech} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)] text-muted-foreground">
                {tech}
              </span>
            ))}
            {(extraTechs + Math.max(0, techs.length - 3)) > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)] text-muted-foreground">
                +{extraTechs + Math.max(0, techs.length - 3)}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
