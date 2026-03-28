import skillsData from "../data/skills.json";
import { useReveal } from "../hooks/use-reveal";

interface Skill {
  icon: string;
}

interface SkillCategory {
  title: string;
  skills: Skill[];
}

export function SkillsSection() {
  const skillCategories = skillsData.skillCategories as SkillCategory[];
  const { isVisible, ref } = useReveal(0.05);

  return (
    <section id="skills" ref={ref} className="min-h-screen flex items-center py-20 px-6 md:px-12 lg:px-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 relative transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="text-6xl md:text-7xl font-bold text-figma-border/30 uppercase tracking-wider absolute left-1/2 -translate-x-1/2 top-0 whitespace-nowrap">
            EXPERTISE
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold pt-6 relative z-10">
            MY <span className="text-primary">SKILLS</span>
          </h3>
        </div>

        <div className="space-y-12">
          {skillCategories.map((category, idx) => (
            <div
              key={idx}
              className={`text-center ${isVisible ? "animate-in fade-in slide-in-from-bottom duration-700 fill-mode-backwards" : "opacity-0"}`}
              style={{ animationDelay: isVisible ? `${idx * 200}ms` : '0ms' }}
            >
              <h5 className="text-lg font-semibold text-muted-foreground mb-6">{category.title}</h5>
              <div className="flex flex-wrap justify-center gap-4">
                {category.skills.map((skill, sIdx) => {
                  const imgSrc = `https://go-skill-icons.vercel.app/api/icons?i=${skill.icon}`;
                  return (
                    <div
                      key={sIdx}
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden figma-skill-icon cursor-default group relative ${isVisible ? "animate-in zoom-in fade-in duration-500 fill-mode-backwards" : "opacity-0"}`}
                      style={{ animationDelay: isVisible ? `${(idx * 200) + (sIdx * 50)}ms` : '0ms' }}
                    >
                      <img src={imgSrc} alt={skill.icon} className="w-full h-full object-contain p-2 md:p-3" />
                      {/* Tooltip */}
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-figma-card text-foreground text-[10px] py-1 px-2 rounded-md border border-figma-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {skill.icon}
                      </span>
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
