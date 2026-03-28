import React, { useState } from "react"
import { Home, User, Briefcase, Wrench, Mail, Menu, X } from "lucide-react";
import navData from "../data/navigation.json";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Home: <Home className="w-6 h-6" />,
  User: <User className="w-6 h-6" />,
  Wrench: <Wrench className="w-6 h-6" />,
  Briefcase: <Briefcase className="w-6 h-6" />,
  Mail: <Mail className="w-6 h-6" />,
};

export function SideNav({ activeSection, onNavigate }: { activeSection: string; onNavigate: (section: string) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: NavItem[] = navData.navItems.map((item) => ({
    ...item,
    icon: ICON_MAP[item.icon] || <Home className="w-6 h-6" />,
  }));

  const handleNavClick = (href: string) => {
    onNavigate(href);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col items-center gap-4 z-50">
        <nav className="flex flex-col gap-3">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => onNavigate(item.href)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                activeSection === item.href
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_16px_rgba(118,60,172,0.5)]"
                  : "bg-figma-header border-figma-border text-muted-foreground hover:text-primary hover:border-figma-border-light hover:shadow-[0_0_12px_rgba(118,60,172,0.3)]"
              }`}
              aria-label={item.label}
            >
              {item.icon}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile FAB */}
      <div className="lg:hidden fixed right-6 bottom-6 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_24px_rgba(118,60,172,0.6)] cursor-pointer"
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="relative bg-figma-header/90 backdrop-blur-2xl rounded-[3rem] w-[320px] h-[320px] shadow-2xl border border-figma-border animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-figma-purple/10 blur-3xl" />

            {navItems.map((item, index) => {
              const angle = (index * 72) - 90;
              const radius = 100;
              const rad = (angle * Math.PI) / 180;
              const x = 160 + radius * Math.cos(rad);
              const y = 160 + radius * Math.sin(rad);

              return (
                <button
                  key={index}
                  onClick={() => handleNavClick(item.href)}
                  className="absolute flex flex-col items-center justify-center group transition-all -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}px`, top: `${y}px` }}
                  aria-label={item.label}
                >
                  <div className={`transition-all ${
                    activeSection === item.href
                      ? "text-primary scale-125"
                      : "text-white/70 group-hover:text-primary"
                  }`}>
                    {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "w-8 h-8" })}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setIsMenuOpen(false)} />
        </div>
      )}
    </>
  );
}
