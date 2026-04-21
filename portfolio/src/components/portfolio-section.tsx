import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import portfolioData from "../data/portfolio.json";
import { useReveal } from "../hooks/use-reveal";
import type { PortfolioItem, PortfolioFilter, Category } from "../types/portfolio";
import { MasonryCard } from "./portfolio/MasonryCard";
import { ProjectModal } from "./portfolio/ProjectModal";
import { FilterTabs } from "./portfolio/FilterTabs";

const portfolioItems = portfolioData.items as PortfolioItem[];
const filters = portfolioData.filters as PortfolioFilter[];

const PAGE_SIZE = 5;

/** Index 0 on each page is always the wide featured card */
function isFeaturedIndex(index: number) {
  return index === 0;
}

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

    // Float the pinned featured item to position 0 so it always gets col-span-2
    const pinnedIdx = filtered.findIndex((i) => i.featured);
    if (pinnedIdx > 0) {
      const reordered = [...filtered];
      const [pinned] = reordered.splice(pinnedIdx, 1);
      reordered.unshift(pinned);
      return reordered;
    }
    return filtered;
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
    <section id="portfolio" ref={ref} className="py-24 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/3 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10 px-4">
        {/* Section Header */}
        <div
          className={`text-center mb-16 relative transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <span
            aria-hidden="true"
            className="text-6xl md:text-7xl font-bold text-white/8 uppercase tracking-wider absolute left-1/2 -translate-x-1/2 top-0 whitespace-nowrap select-none"
          >
            WORKS
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight pt-6 relative z-10">
            MY <span className="text-white">PORTFOLIO</span>
          </h2>
          <div className="w-16 h-1 bg-white mx-auto mt-4 rounded-full" />
        </div>

        {/* Filter Tabs */}
        <div
          className={`transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <FilterTabs filters={filters} active={activeFilter} counts={counts} onChange={handleFilterChange} />
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-4xl mb-3">🗂️</p>
            <p className="font-medium">No projects in this category yet.</p>
          </div>
        )}

        {/* Masonry Grid — 3 cols lg / 2 cols md / 1 col sm */}
        {pageItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-auto">
            {pageItems.map((item, index) => (
              <MasonryCard
                key={item.id}
                item={item}
                index={index}
                isVisible={isVisible}
                isFeatured={isFeaturedIndex(index)}
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
            <p className="text-xs text-muted-foreground">
              Page {safePage} of {totalPages} &nbsp;·&nbsp; {filteredItems.length} projects
            </p>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => goTo(safePage - 1)}
                disabled={safePage === 1}
                aria-label="Previous page"
                className="p-2 rounded-[8px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] bg-[#111111]/60
                  text-muted-foreground hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)]
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
                    className={`min-w-[36px] h-9 px-2 rounded-[8px] text-sm font-semibold
                      motion-safe:transition-all motion-safe:duration-200 ${
                      p === safePage
                        ? "bg-white text-[#0a0a0a] shadow-none"
                        : "shadow-[0_0_0_1px_rgba(255,255,255,0.08)] bg-[#111111]/60 text-muted-foreground hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
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
                className="p-2 rounded-[8px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] bg-[#111111]/60
                  text-muted-foreground hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)]
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
