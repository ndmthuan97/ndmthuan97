import aboutData from "../data/about.json";
import { useReveal } from "../hooks/use-reveal";
import { Card, CardContent } from "./ui/card";


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
  const stats = aboutData.stats as StatItem[];
  const personalInfo = aboutData.personalInfo as PersonalInfo[];
  const { isVisible, ref } = useReveal(0.05);

  return (
    <section id="about" ref={ref} className="min-h-screen flex items-center py-20 px-6 md:px-12 lg:px-20 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-20 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className={`text-center mb-16 relative transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <span aria-hidden="true" className="text-6xl md:text-7xl font-bold text-figma-border/25 uppercase tracking-wider absolute left-1/2 -translate-x-1/2 top-0 whitespace-nowrap select-none">
            RESUME
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight pt-6 relative z-10">
            ABOUT <span className="text-primary">ME</span>
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Personal Info */}
          <div className={`${isVisible ? "animate-in slide-in-from-left fade-in duration-700 fill-mode-backwards delay-200" : "opacity-0"}`}>
            <h4 className="text-xl font-bold text-foreground mb-6 uppercase tracking-widest text-sm">
              Personal Information
            </h4>
            <div className="space-y-3 mb-8">
              {personalInfo.map((item, index) => (
                <div key={index} className="flex justify-between sm:justify-start sm:gap-4 border-b border-figma-border/30 pb-3">
                  <span className="text-muted-foreground text-sm min-w-[120px]">{item.label}</span>
                  <span className={`text-sm font-medium ${item.highlight ? "text-figma-accent" : "text-foreground"}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className={`figma-stat-card border-0 rounded-xl overflow-hidden group ${isVisible ? "animate-in zoom-in fade-in duration-500 fill-mode-backwards" : "opacity-0"}`}
                style={{ animationDelay: isVisible ? `${500 + (index * 150)}ms` : '0ms' }}
              >
                <CardContent className="p-6 flex flex-col justify-center h-full min-h-[120px]">
                  <div className="mb-1">
                    <span className="text-4xl md:text-5xl font-black text-primary group-hover:text-figma-accent transition-colors">
                      {stat.value}
                    </span>
                    <span className="text-primary text-2xl font-bold">{stat.suffix}</span>
                  </div>
                  <div className="text-xs text-muted-foreground uppercase leading-tight tracking-widest font-medium">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
