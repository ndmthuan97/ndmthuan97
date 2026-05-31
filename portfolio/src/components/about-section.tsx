import { Check } from "lucide-react";
import aboutData from "../data/about.json";
import { useReveal } from "../hooks/use-reveal";

interface StatItem {
  value: string;
  suffix?: string;
  label: string;
}

interface PersonalInfo {
  label: string;
  value: string;
  highlight?: boolean;
}

export function AboutSection() {
  const { summary, highlights } = aboutData as { summary: string; highlights: string[] };
  const stats = aboutData.stats as StatItem[];
  const personalInfo = aboutData.personalInfo as PersonalInfo[];
  const { isVisible, ref } = useReveal(0.05);

  return (
    <section id="about" ref={ref} className="py-24 md:py-32 px-6 md:px-10 lg:px-20 relative">
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className={`relative mb-14 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span aria-hidden="true" className="section-watermark absolute -top-10 left-0 text-7xl md:text-8xl">
            RESUME
          </span>
          <h2 className="font-display font-bold tracking-tight text-3xl md:text-4xl text-foreground">
            About
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">
          {/* Left: summary + highlights + info */}
          <div className={`lg:col-span-3 ${isVisible ? "animate-in slide-in-from-left fade-in duration-700 fill-mode-backwards delay-200" : "opacity-0"}`}>
            <p className="text-foreground/90 text-lg leading-relaxed mb-8 max-w-2xl">
              {summary}
            </p>

            {/* Highlights */}
            <ul className="space-y-3 mb-10">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full brand-soft shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="text-muted-foreground text-sm leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>

            {/* Compact info */}
            <dl className="flex flex-wrap gap-x-10 gap-y-4">
              {personalInfo.map((item, index) => (
                <div key={index}>
                  <dt className="mono-label text-muted-foreground text-[10px] mb-1">{item.label}</dt>
                  <dd className={`text-sm font-medium ${item.highlight ? "text-brand" : "text-foreground"}`}>
                    {item.highlight && <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand mr-1.5 align-middle animate-pulse" />}
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right: stats */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`surface surface-hover p-6 flex flex-col justify-center min-h-[130px] ${isVisible ? "animate-in zoom-in-95 fade-in duration-500 fill-mode-backwards" : "opacity-0"}`}
                style={{ animationDelay: isVisible ? `${400 + index * 120}ms` : "0ms" }}
              >
                <div className="flex items-baseline gap-0.5 mb-1.5">
                  <span className="font-display font-bold text-4xl md:text-5xl text-foreground tracking-tight">
                    {stat.value}
                  </span>
                  {stat.suffix && (
                    <span className="font-display font-semibold text-2xl text-brand">{stat.suffix}</span>
                  )}
                </div>
                <div className="mono-label text-muted-foreground text-[11px] leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
