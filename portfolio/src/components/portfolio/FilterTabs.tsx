import { useRef, useEffect, useState } from "react";
import type { PortfolioFilter } from "../../types/portfolio";

interface FilterTabsProps {
  filters: PortfolioFilter[];
  active: string;
  counts: Record<string, number>;
  onChange: (value: string) => void;
}

export function FilterTabs({ filters, active, counts, onChange }: FilterTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = filters.findIndex((f) => f.value === active);
    const el = tabRefs.current[idx];
    if (el) {
      const parent = el.parentElement?.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      if (parent) setIndicator({ left: rect.left - parent.left, width: rect.width });
    }
  }, [active, filters]);

  return (
    <div className="relative flex justify-center mb-10">
      <div className="relative flex gap-1 p-1 bg-[#171717]/60 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-full backdrop-blur-sm overflow-x-auto">
        {/* Sliding indicator */}
        <div
          className="absolute top-1 bottom-1 rounded-full bg-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] motion-safe:transition-all motion-safe:duration-300 ease-out pointer-events-none"
          style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
        />
        {filters.map((filter, idx) => (
          <button
            key={filter.value}
            ref={(el) => { tabRefs.current[idx] = el; }}
            onClick={() => onChange(filter.value)}
            className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest motion-safe:transition-colors motion-safe:duration-200 whitespace-nowrap flex items-center gap-1.5 ${
              active === filter.value ? "text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.label}
            {counts[filter.value] !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                active === filter.value
                  ? "bg-white/20 text-white"
                  : "bg-[#111111] text-muted-foreground"
              }`}>
                {counts[filter.value]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
