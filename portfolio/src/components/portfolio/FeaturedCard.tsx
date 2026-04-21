import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "../ui/badge";
import { assetPath } from "../../utils/asset-path";
import type { PortfolioItem } from "../../types/portfolio";

function getCategoryStyle(cat: string) {
  if (cat === "backend") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (cat === "frontend") return "bg-violet-500/15 text-violet-400 border-violet-500/30";
  if (cat === "mobile") return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  return "bg-white/10 text-white border-white/20";
}

function getAllTechs(item: PortfolioItem): string[] {
  const t = item.technologies;
  if (!t) return [];
  return [...new Set([...(t.backend ?? []), ...(t.frontend ?? []), ...(t.mobile ?? []), ...(t.thirdParty ?? [])])];
}

export function FeaturedCard({
  item,
  isVisible,
  onSelect,
}: {
  item: PortfolioItem;
  isVisible: boolean;
  onSelect: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const techs = getAllTechs(item).slice(0, 5);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
      }}
      aria-label={`View featured project: ${item.title}`}
      className={`group relative rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.08)] bg-[#111111]/60 backdrop-blur-sm overflow-hidden cursor-pointer hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] motion-safe:transition-all motion-safe:duration-500 ${
        isVisible ? "animate-in fade-in slide-in-from-bottom duration-700" : "opacity-0"
      }`}
    >
      {/* Featured badge */}
      <div className="absolute top-4 left-4 z-20">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Featured
        </span>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Image */}
        <div className="relative lg:w-[55%] h-56 lg:h-80 overflow-hidden bg-[#111111] flex-shrink-0">
          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#111111] via-[#171717]/60 to-[#111111] bg-[length:200%_100%]" />
          )}
          <img
            src={assetPath(item.image || "/default.png")}
            alt={item.title}
            onLoad={() => setImgLoaded(true)}
            onError={(e) => { setImgLoaded(true); (e.target as HTMLImageElement).src = assetPath("/default.png"); }}
            className={`w-full h-full object-cover motion-safe:transition-all motion-safe:duration-700 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent lg:to-[#111111]/80 pointer-events-none hidden lg:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 to-transparent pointer-events-none lg:hidden" />
        </div>

        {/* Content */}
        <div className="lg:w-[45%] p-6 lg:p-8 flex flex-col justify-center gap-4">
          <div className="flex flex-wrap gap-1.5">
            {item.category.map((cat) => (
              <Badge key={cat} variant="outline" className={`text-[10px] font-bold uppercase tracking-wide ${getCategoryStyle(cat)}`}>
                {cat}
              </Badge>
            ))}
          </div>

          <div>
            <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-foreground group-hover:text-white motion-safe:transition-colors motion-safe:duration-300 mb-2">
              {item.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{item.description}</p>
          </div>

          {/* Tech pills */}
          {techs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {techs.map((tech) => (
                <span key={tech} className="text-[11px] px-2.5 py-1 rounded-full bg-[#111111]/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] text-muted-foreground font-medium">
                  {tech}
                </span>
              ))}
              {getAllTechs(item).length > 5 && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#111111]/80 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] text-muted-foreground font-medium">
                  +{getAllTechs(item).length - 5} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 pt-1">
            <span className="inline-flex items-center gap-1.5 text-white text-sm font-semibold group-hover:gap-2 motion-safe:transition-all motion-safe:duration-200">
              View Details <ExternalLink size={13} />
            </span>
            {item.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
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
