import { useState } from "react";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import { assetPath } from "../../utils/asset-path";
import { cardHighlights, categoryBadgeClass, getTechIcons } from "../../lib/portfolio-helpers";
import { TechIcon } from "../tech-icon";
import { RichText } from "../rich-text";
import { ProjectTypeBadge } from "./ProjectTypeBadge";
import { RealUsersBadge } from "./RealUsersBadge";
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
      {/* TechIcon owns the title tooltip + accessible name for each logo. */}
      {icons.map((t) => (
        <TechIcon key={t.slug} name={t.name} srcs={t.srcs} size={30} />
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
    // Clicking anywhere on the card is a pointer shortcut only — it is deliberately
    // NOT role="button"/tabIndex here. The real control is the "View details"
    // button at the foot of the card, which carries the accessible name and the
    // keyboard focus; a role="button" wrapper around a real button would nest two
    // controls and make the card read twice to assistive tech.
    <article
      onClick={onSelect}
      className={`${baseClass} flex flex-col p-6 md:p-7`}
      style={{ animationDelay: delay }}
    >
      {/* Header: thumbnail × (title over category) */}
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-secondary ring-line flex-shrink-0">
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
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display font-bold text-xl md:text-2xl leading-tight tracking-tight text-foreground">
              {item.title}
            </h3>
            {item.year && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 brand-soft rounded-full font-mono text-[10px] font-medium shrink-0">
                <Calendar size={11} />
                {item.year}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <CatBadges cats={item.category} />
            <ProjectTypeBadge type={item.projectType} />
          </div>
          {(item.hasRealUsers || item.role) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <RealUsersBadge active={item.hasRealUsers} />
              {item.role && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                  <Sparkles size={12} className="text-brand" />
                  <span><span className="font-semibold text-foreground/70">Role:</span> {item.role}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 sm:line-clamp-2 mt-4">{item.description}</p>

      {/* Quick highlights — scannable bullets */}
      {highlights.length > 0 && (
        <ul className="mt-3 pl-5 md:pl-6 flex flex-col gap-1.5">
          {highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-brand/50 mt-1.5 shrink-0" />
              {/* 2 lines: highlights carry their "why" after an em dash, which clamps away at 1 line.
                  RichText because these strings are the project page's `highlights`/`features`
                  verbatim — rendered raw, their ** markers would show up as asterisks. */}
              <span className="leading-snug line-clamp-2"><RichText>{h}</RichText></span>
            </li>
          ))}
        </ul>
      )}

      {/* Footer — mt-auto pins it so cards of differing heights line their footers
          up. No flex-wrap on this row: the icons wrap inside their own box (which
          needs min-w-0 to be allowed to shrink), so however many there are the
          button keeps its corner instead of being bumped onto a line below.
          items-end holds it to the bottom of that row when the icons run to two.
          stopPropagation keeps the article's pointer shortcut from firing
          onSelect a second time on top of the button's own click. */}
      <div className="mt-auto pt-5 flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <TechIcons item={item} />
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          aria-label={`View details: ${item.title}`}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-secondary ring-line px-3.5 py-1.5 text-xs font-semibold text-foreground cursor-pointer hover:bg-brand hover:text-brand-foreground hover:ring-strong motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          View details
          <ArrowRight
            size={13}
            strokeWidth={2.5}
            className="motion-safe:transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>
    </article>
  );
}
