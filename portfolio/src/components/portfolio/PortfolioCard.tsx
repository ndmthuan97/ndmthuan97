import { useState } from "react";
import { Badge } from "../ui/badge";
import { assetPath } from "../../utils/asset-path";
import type { PortfolioItem } from "../../types/portfolio";

function getCategoryStyle(cat: string) {
  if (cat === "backend") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (cat === "frontend") return "bg-violet-500/15 text-violet-400 border-violet-500/30";
  if (cat === "mobile") return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  return "bg-white/10 text-white border-white/20";
}

export function PortfolioCard({
  item,
  index,
  isVisible,
  onSelect,
}: {
  item: PortfolioItem;
  index: number;
  isVisible: boolean;
  onSelect: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
      }}
      aria-label={`View details for ${item.title}`}
      className={`group relative overflow-hidden rounded-xl cursor-pointer shadow-[0_0_0_1px_rgba(255,255,255,0.08)] bg-[#171717]/80 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] motion-safe:transition-all motion-safe:duration-300 ${
        isVisible ? "animate-in fade-in slide-in-from-bottom duration-500 fill-mode-backwards" : "opacity-0"
      }`}
      style={{ animationDelay: isVisible ? `${index * 100}ms` : "0ms" }}
    >
      {/* Image with skeleton */}
      <div className="relative h-48 overflow-hidden bg-[#111111]">
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#111111] via-[#171717]/60 to-[#111111] bg-[length:200%_100%]" />
        )}
        <img
          src={assetPath(item.image || "/default.png")}
          alt={item.title}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { setImgLoaded(true); (e.target as HTMLImageElement).src = assetPath("/default.png"); }}
          className={`w-full h-full object-cover motion-safe:transition-all motion-safe:duration-500 group-hover:scale-110 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-[#0a0a0a]/70 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-300 flex items-center justify-center">
          <span className="text-white font-medium tracking-wide px-4 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] rounded-full bg-[#171717]/50 backdrop-blur-sm text-sm">
            View Details
          </span>
        </div>
        {/* Shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-500 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.category.map((cat) => (
            <Badge key={cat} variant="outline" className={`text-[10px] font-bold uppercase tracking-wide ${getCategoryStyle(cat)}`}>
              {cat}
            </Badge>
          ))}
        </div>
        <h3 className="text-lg font-bold mb-2 group-hover:text-white motion-safe:transition-colors">{item.title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-3">{item.description}</p>
      </div>
    </article>
  );
}
