import React, { useState } from "react"
import { Home, User, Briefcase, Wrench, Mail, Menu, X, Settings } from "lucide-react";
import navData from "../data/navigation.json";

interface NavItem {
  icon: (size?: number) => React.ReactNode;
  label: string;
  href: string;
}

const ICON_MAP: Record<string, (size?: number) => React.ReactNode> = {
  Home: (size = 24) => <Home width={size} height={size} />,
  User: (size = 24) => <User width={size} height={size} />,
  Wrench: (size = 24) => <Wrench width={size} height={size} />,
  Briefcase: (size = 24) => <Briefcase width={size} height={size} />,
  Mail: (size = 24) => <Mail width={size} height={size} />,
};

const goAdmin = () => { window.location.hash = "admin"; };

export function SideNav({ activeSection, onNavigate }: { activeSection: string; onNavigate: (section: string) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: NavItem[] = navData.navItems.map((item) => ({
    ...item,
    icon: ICON_MAP[item.icon] ?? ((size?: number) => <Home width={size ?? 24} height={size ?? 24} />),
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
              {item.icon(24)}
            </button>
          ))}
        </nav>

        {/* Admin button — desktop */}
        <div className="relative group">
          <button
            onClick={goAdmin}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border border-figma-border/40 bg-figma-header/60 text-muted-foreground/50 hover:text-figma-accent hover:border-figma-accent/40 hover:bg-figma-accent/10 hover:shadow-[0_0_10px_rgba(118,60,172,0.25)]"
            aria-label="Admin panel"
          >
            <Settings size={15} />
          </button>
          {/* Tooltip */}
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-figma-card border border-figma-border rounded text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Admin
          </span>
        </div>
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

            {/* Nav items — radial */}
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
                    {item.icon(32)}
                  </div>
                </button>
              );
            })}

            {/* Admin button — center of radial menu */}
            <button
              onClick={() => { setIsMenuOpen(false); goAdmin(); }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-figma-border/50 bg-figma-card/60 text-muted-foreground/60 flex items-center justify-center hover:text-figma-accent hover:border-figma-accent/50 hover:bg-figma-accent/10 transition-all"
              aria-label="Admin panel"
              title="Admin"
            >
              <Settings size={18} />
            </button>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setIsMenuOpen(false)} />
        </div>
      )}
    </>
  );
}
