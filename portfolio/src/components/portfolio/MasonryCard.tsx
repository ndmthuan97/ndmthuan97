import { useState } from "react";
import { ArrowUpRight, Calendar, Sparkles } from "lucide-react";
import { assetPath } from "../../utils/asset-path";
import { cardHighlights, categoryBadgeClass, getTechIcons } from "../../lib/portfolio-helpers";
import { TechIcon } from "../tech-icon";
import { ProjectTypeBadge } from "./ProjectTypeBadge";
import type { PortfolioItem } from "../../types/portfolio";

function CatBadges({ cats }: { cats: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {cats.map((cat) => (
        <span key={cat} className={`font-mono text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryBadgeClass(cat)}`}>
          {cat}
        </span>
      ))}
    </div>
  );
}

function TechIcons({ item }: { item: PortfolioItem }) {
  const icons = getTechIcons(item);
  if (icons.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {icons.map((t) => (
        <div
          key={t.slug}
          title={t.name}
          className="inline-flex items-center justify-center"
        >
          <TechIcon name={t.name} srcs={t.srcs} size={30} />
        </div>
      ))}
    </div>
  );
}

export function MasonryCard({
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
  const highlights = cardHighlights(item);

  const baseClass = `group surface surface-hover relative overflow-hidden cursor-pointer
    ${isVisible ? "animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-backwards" : "opacity-0"}`;

  const delay = `${Math.min(index * 80, 400)}ms`;

  return (
    <article
      role="button" tabIndex={0} onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      aria-label={`View project: ${item.title}`}
      className={`${baseClass} flex flex-col p-6 md:p-7`}
      style={{ animationDelay: delay }}
    >
      {/* Header: thumbnail × (title over category) */}
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-secondary ring-line flex-shrink-0">
          {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-secondary" />}
          <img
            src={assetPath(item.image || "/default.png")}
            alt={item.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => { setImgLoaded(true); (e.target as HTMLImageElement).src = assetPath("/default.png"); }}
            className={`w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display font-bold text-xl md:text-2xl leading-tight tracking-tight text-foreground">
              {item.title}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              {item.year && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 brand-soft rounded-full font-mono text-[10px] font-medium">
                  <Calendar size={11} />
                  {item.year}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <CatBadges cats={item.category} />
            <ProjectTypeBadge type={item.projectType} />
            {item.role && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                <Sparkles size={12} className="text-brand" />
                {item.role}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mt-4">{item.description}</p>

      {/* Quick highlights — scannable bullets */}
      {highlights.length > 0 && (
        <ul className="mt-3 pl-5 md:pl-6 flex flex-col gap-1.5">
          {highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-brand/50 mt-1.5 shrink-0" />
              <span className="leading-snug line-clamp-1">{h}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <div className="mt-auto pt-5 flex items-center justify-between gap-3 flex-wrap">
        <TechIcons item={item} />
        <span className="inline-flex items-center gap-1 text-foreground text-sm font-medium group-hover:gap-1.5 motion-safe:transition-all shrink-0">
          Details <ArrowUpRight size={15} />
        </span>
      </div>
    </article>
  );
}
