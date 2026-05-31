import skillsData from "../data/skills.json";
import { useReveal } from "../hooks/use-reveal";
import { iconSources } from "../lib/portfolio-helpers";
import { TechIcon } from "./tech-icon";

interface Skill {
  icon: string;
}

interface SkillCategory {
  title: string;
  skills: Skill[];
}

/** Human-readable display names for icon slugs */
const SKILL_DISPLAY_NAMES: Record<string, string> = {
  dotnet: ".NET",
  cs: "C#",
  java: "Java",
  spring: "Spring",
  redis: "Redis",
  postgres: "PostgreSQL",
  sqlserver: "SQL Server",
  angular: "Angular",
  typescript: "TypeScript",
  html: "HTML",
  css: "CSS",
  js: "JavaScript",
  tailwindcss: "Tailwind CSS",
  bootstrap: "Bootstrap",
  primeng: "PrimeNG",
  docker: "Docker",
  git: "Git",
  github: "GitHub",
  azure: "Azure",
  vercel: "Vercel",
  postman: "Postman",
  figma: "Figma",
  jira: "Jira",
};

export function SkillsSection() {
  const skillCategories = skillsData.skillCategories as SkillCategory[];
  const { isVisible, ref } = useReveal(0.05);

  return (
    <section id="skills" ref={ref} className="py-24 md:py-32 px-6 md:px-10 lg:px-20 relative">
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className={`relative mb-14 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span aria-hidden="true" className="section-watermark absolute -top-10 left-0 text-7xl md:text-8xl">
            STACK
          </span>
          <h2 className="font-display font-bold tracking-tight text-3xl md:text-4xl text-foreground">
            Skills
          </h2>
        </div>

        <div className="space-y-10">
          {skillCategories.map((category, idx) => (
            <div
              key={idx}
              className={`grid md:grid-cols-[160px_1fr] gap-4 md:gap-8 items-start ${isVisible ? "animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-backwards" : "opacity-0"}`}
              style={{ animationDelay: isVisible ? `${idx * 150}ms` : "0ms" }}
            >
              <h3 className="mono-label text-muted-foreground pt-2">{category.title}</h3>
              <div className="flex flex-wrap gap-3.5">
                {category.skills.map((skill, sIdx) => {
                  const name = SKILL_DISPLAY_NAMES[skill.icon] ?? skill.icon;
                  return (
                    <div
                      key={sIdx}
                      title={name}
                      className="inline-flex items-center justify-center"
                    >
                      <TechIcon name={name} srcs={iconSources(skill.icon)} size={38} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
