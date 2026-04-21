import { useState, useMemo } from "react";
import portfolioData from "../data/portfolio.json";
import { useReveal } from "../hooks/use-reveal";
import type { PortfolioItem, PortfolioFilter } from "../types/portfolio";
import { FeaturedCard } from "./portfolio/FeaturedCard";
import { PortfolioCard } from "./portfolio/PortfolioCard";
import { ProjectModal } from "./portfolio/ProjectModal";
import { FilterTabs } from "./portfolio/FilterTabs";

const portfolioItems = portfolioData.items as PortfolioItem[];
const filters = portfolioData.filters as PortfolioFilter[];

export function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);
  const { isVisible, ref } = useReveal(0.05);

  const filteredItems = useMemo(() =>
    activeFilter === "all"
      ? portfolioItems
      : portfolioItems.filter((item) => item.category.includes(activeFilter as never)),
    [activeFilter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: portfolioItems.length };
    filters.forEach((f) => {
      if (f.value !== "all") {
        c[f.value] = portfolioItems.filter((item) => item.category.includes(f.value as never)).length;
      }
    });
    return c;
  }, []);

  const featuredItem = filteredItems[0] ?? null;
  const restItems = filteredItems.slice(1);

  return (
    <section
      id="portfolio"
      ref={ref}
      className="py-24 relative overflow-hidden"
    >
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/3 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10 px-4">
        {/* Section Header */}
        <div className={`text-center mb-16 relative transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
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
        <div className={`transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <FilterTabs
            filters={filters}
            active={activeFilter}
            counts={counts}
            onChange={setActiveFilter}
          />
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-4xl mb-3">🗂️</p>
            <p className="font-medium">No projects in this category yet.</p>
          </div>
        )}

        {/* Featured Card */}
        {featuredItem && (
          <div className={`mb-8 transition-all duration-700 delay-150 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <FeaturedCard
              item={featuredItem}
              isVisible={isVisible}
              onSelect={() => setSelectedProject(featuredItem)}
            />
          </div>
        )}

        {/* 2-column grid */}
        {restItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {restItems.map((item, index) => (
              <PortfolioCard
                key={item.id}
                item={item}
                index={index}
                isVisible={isVisible}
                onSelect={() => setSelectedProject(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedProject && (
        <ProjectModal
          item={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
}
