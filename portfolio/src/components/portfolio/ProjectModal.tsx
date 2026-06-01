import { useEffect, useRef } from "react";
import { X, ExternalLink, FileText, Sparkles, Layers } from "lucide-react";
import { assetPath } from "../../utils/asset-path";
import { categoryStyle, getTechIcons } from "../../lib/portfolio-helpers";
import { TechIcon } from "../tech-icon";
import { ProjectTypeBadge } from "./ProjectTypeBadge";
import type { PortfolioItem } from "../../types/portfolio";

export function ProjectModal({ item, onClose }: { item: PortfolioItem; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const techIcons = getTechIcons(item);

  // Links not already represented by a category badge (e.g. GitHub, Live).
  const extraLinks = item.links?.filter((l) =>
    !item.category.some((cat) =>
      l.label.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(l.label.toLowerCase())
    )
  ) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-foreground/40 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
      aria-label="Close modal"
    >
      <div
        ref={dialogRef}
        id="portfolio-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-project-title"
        className="relative w-full max-w-3xl bg-card rounded-xl shadow-card animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-secondary ring-line text-foreground hover:ring-strong motion-safe:transition-all cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-5 md:p-6 border-b border-border flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
            <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl ring-line bg-secondary">
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

            <div className="flex-1 min-w-0 space-y-2 pr-8">
              <h3 id="modal-project-title" className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
                {item.title}
              </h3>

              {/* Category badges + project type */}
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5">
                {item.category.map((cat) => (
                  <span
                    key={cat}
                    className={`font-mono text-[9px] md:text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${categoryStyle(cat).muted}`}
                  >
                    {cat}
                  </span>
                ))}
                <ProjectTypeBadge type={item.projectType} size={12} />
              </div>

              {/* Meta: role · year */}
              {(item.role || item.year) && (
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
                  {item.role && <span>{item.role}</span>}
                  {item.year && <span>· {item.year}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          {(item.demoUrl || extraLinks.length > 0) && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
              {item.demoUrl && (
                <a
                  href={item.demoUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded-md hover:opacity-90 motion-safe:transition-all"
                >
                  Live demo <ExternalLink size={12} />
                </a>
              )}
              {extraLinks.map((link, idx) => (
                <a
                  key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-secondary text-foreground ring-line hover:ring-strong px-3 py-1.5 rounded-md motion-safe:transition-all"
                >
                  {link.label} <ExternalLink size={12} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar space-y-7">
          {/* Overview */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-brand flex-shrink-0" />
              <h6 className="font-mono text-xs font-medium uppercase text-foreground tracking-wider">Overview</h6>
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">
              {item.overview || item.description}
            </p>
          </section>

          {/* Key Features */}
          {item.features && item.features.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-brand flex-shrink-0" />
                <h6 className="font-mono text-xs font-medium uppercase text-foreground tracking-wider">Key Features</h6>
              </div>
              <ul className="flex flex-col gap-y-3">
                {item.features.map((feature, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-muted-foreground items-start group">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand/50 mt-1.5 flex-shrink-0 group-hover:scale-125 group-hover:bg-brand motion-safe:transition-all" />
                    <span className="leading-relaxed whitespace-pre-line">{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Tech Stack */}
          {techIcons.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-brand flex-shrink-0" />
                <h6 className="font-mono text-xs font-medium uppercase text-foreground tracking-wider">Tech Stack</h6>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2.5">
                {techIcons.map((t) => (
                  <div key={t.slug} className="inline-flex items-center gap-2">
                    <TechIcon name={t.name} srcs={t.srcs} size={26} />
                    <span className="text-xs font-medium text-foreground">{t.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
