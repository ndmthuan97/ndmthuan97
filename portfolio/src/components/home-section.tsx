import { ArrowRight } from "lucide-react";
import homeData from "../data/home.json";
import { useReveal } from "../hooks/use-reveal";
import { assetPath } from "../utils/asset-path";

export function HeroSection({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { name, role, bio, profileImage } = homeData;
  const { isVisible, ref } = useReveal(0.05);

  return (
    <section id="home" ref={ref} className="min-h-screen flex items-center relative overflow-hidden">


      <div className="container mx-auto px-6 md:px-12 lg:px-20 flex justify-center">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 w-full max-w-7xl">
          {/* Profile Image */}
          <div className={`relative z-10 flex-shrink-0 ${isVisible ? "animate-in zoom-in fade-in duration-1000" : "opacity-0"}`}>
            <div className={`relative w-64 aspect-[3/4] md:w-80 lg:w-[28rem] overflow-hidden shadow-2xl ${isVisible ? "animate-profile" : ""} border-4 border-primary/20`}>
              <img
                src={assetPath(profileImage)}
                alt={`${name} - ${role}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-center lg:text-left z-10 max-w-2xl">
            <div className={`flex items-center justify-center lg:justify-start gap-4 mb-4 ${isVisible ? "animate-in slide-in-from-left fade-in duration-1000 delay-300 fill-mode-backwards" : "opacity-0"}`}>
              <span className="w-10 h-0.5 bg-primary" />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                <span className="text-primary">{`I'M ${name.toUpperCase()}.`}</span>
              </h1>
            </div>

            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 ${isVisible ? "animate-in slide-in-from-left fade-in duration-1000 delay-300 fill-mode-backwards" : "opacity-0"}`}>
              {role}
            </h2>

            <p className={`text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 whitespace-pre-line ${isVisible ? "animate-in slide-in-from-left fade-in duration-1000 delay-500 fill-mode-backwards" : "opacity-0"}`}>
              {bio}
            </p>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => {
                onNavigate?.("about");
              }}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary-foreground font-semibold tracking-wide bg-primary transition-all group ${isVisible ? "animate-in fade-in slide-in-from-bottom duration-1000 delay-700 fill-mode-backwards" : "opacity-0"}`}
            >
              <span>MORE ABOUT ME</span>
              <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center group-hover:bg-primary-foreground group-hover:text-primary transition-colors">
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
