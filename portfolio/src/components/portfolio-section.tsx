import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import portfolioData from "../data/projects.json";
import { useReveal } from "../hooks/use-reveal";
import type { PortfolioItem, PortfolioFilter, Category } from "../types/portfolio";
import { MasonryCard } from "./portfolio/MasonryCard";
import { ProjectModal } from "./portfolio/ProjectModal";
import { FilterTabs } from "./portfolio/FilterTabs";

const portfolioItems = portfolioData.items as PortfolioItem[];
const filters = portfolioData.filters as PortfolioFilter[];

const PAGE_SIZE = 3;

export function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);
  const { isVisible, ref } = useReveal(0.05);

  const filteredItems = useMemo(() => {
    const filtered =
      activeFilter === "all"
        ? portfolioItems
        : portfolioItems.filter((item) =>
            item.category.includes(activeFilter as Exclude<Category, "all">)
          );

    // Float featured projects to the front (page 1); others keep their order.
    return [...filtered].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  }, [activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  // Clamp page when filter changes
  const safePage = Math.min(currentPage, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, safePage]);

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    setCurrentPage(1);
  };

  const goTo = (page: number) => {
    setCurrentPage(page);
    // Scroll back up to portfolio section smoothly
    document.getElementById("portfolio")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: portfolioItems.length };
    filters.forEach((f) => {
      if (f.value !== "all") {
        c[f.value] = portfolioItems.filter((item) =>
          item.category.includes(f.value as never)
        ).length;
      }
    });
    return c;
  }, []);

  // Hide categories with no projects (e.g. "Desktop" until a desktop project exists).
  // The category stays defined in the data — it's only hidden from the tab bar.
  const visibleFilters = useMemo(
    () => filters.filter((f) => f.value === "all" || (counts[f.value] ?? 0) > 0),
    [counts]
  );

  // Generate page number buttons (always show first, last, current ± 1, with ellipsis)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [];
    const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };
    add(1);
    if (safePage - 2 > 2) pages.push("…");
    for (let p = Math.max(2, safePage - 1); p <= Math.min(totalPages - 1, safePage + 1); p++) add(p);
    if (safePage + 2 < totalPages - 1) pages.push("…");
    add(totalPages);
    return pages;
  }, [totalPages, safePage]);

  return (
    <section id="portfolio" ref={ref} className="py-24 md:py-32 px-6 md:px-10 lg:px-20 relative">
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div
          className={`relative mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span
            aria-hidden="true"
            className="section-watermark absolute -top-10 left-0 text-7xl md:text-8xl"
          >
            WORK
          </span>
          <h2 className="font-display font-bold tracking-tight text-3xl md:text-4xl text-foreground">
            Experience
          </h2>
        </div>

        {/* Filter Tabs */}
        <div
          className={`transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <FilterTabs filters={visibleFilters} active={activeFilter} counts={counts} onChange={handleFilterChange} />
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-4xl mb-3">🗂️</p>
            <p className="font-medium">No projects in this category yet.</p>
          </div>
        )}


        {/* Full-width project rows */}
        {pageItems.length > 0 && (
          <div className="flex flex-col gap-4">
            {pageItems.map((item, index) => (
              <MasonryCard
                key={item.id}
                item={item}
                index={index}
                isVisible={isVisible}
                onSelect={() => setSelectedProject(item)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className={`flex flex-col items-center gap-3 mt-12 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {/* Info */}
            <p className="mono-label text-muted-foreground normal-case tracking-normal">
              Page {safePage} of {totalPages} · {filteredItems.length} projects
            </p>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => goTo(safePage - 1)}
                disabled={safePage === 1}
                aria-label="Previous page"
                className="p-2 rounded-lg ring-line bg-card text-muted-foreground
                  hover:text-foreground hover:ring-strong cursor-pointer
                  motion-safe:transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page numbers */}
              {pageNumbers.map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm select-none">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goTo(p as number)}
                    aria-label={`Go to page ${p}`}
                    aria-current={p === safePage ? "page" : undefined}
                    className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium cursor-pointer
                      motion-safe:transition-all motion-safe:duration-200 ${
                      p === safePage
                        ? "bg-foreground text-background"
                        : "ring-line bg-card text-muted-foreground hover:text-foreground hover:ring-strong"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => goTo(safePage + 1)}
                disabled={safePage === totalPages}
                aria-label="Next page"
                className="p-2 rounded-lg ring-line bg-card text-muted-foreground
                  hover:text-foreground hover:ring-strong cursor-pointer
                  motion-safe:transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedProject && (
        <ProjectModal item={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </section>
  );
}
