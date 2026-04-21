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
      <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col items-center gap-3 z-50">
        <nav className="flex flex-col gap-2">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => onNavigate(item.href)}
              className={`w-14 h-14 rounded-[6px] flex items-center justify-center motion-safe:transition-all motion-safe:duration-150 cursor-pointer ${
                activeSection === item.href
                  ? "bg-white text-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
                  : "bg-[#171717] text-[#666666] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
              }`}
              aria-label={item.label}
            >
              {item.icon(22)}
            </button>
          ))}
        </nav>

        {/* Admin button — desktop, secondary hierarchy */}
        <div className="relative group">
          <button
            onClick={goAdmin}
            className="w-14 h-14 rounded-[6px] flex items-center justify-center motion-safe:transition-all motion-safe:duration-150 cursor-pointer bg-[#171717]/60 text-[#666666]/60 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            aria-label="Admin panel"
          >
            <Settings size={20} />
          </button>
          {/* Tooltip — Vercel badge style */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-[10px] min-h-[24px] flex items-center bg-[#ebf5ff] rounded-[9999px] text-[12px] font-medium text-[#0068d6] whitespace-nowrap opacity-0 group-hover:opacity-100 motion-safe:transition-opacity pointer-events-none">
            Admin
          </span>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="lg:hidden fixed right-6 bottom-6 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-16 h-16 rounded-full bg-white text-[#171717] flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.2)] cursor-pointer motion-safe:transition-all motion-safe:duration-150"
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="relative bg-[#171717]/95 backdrop-blur-2xl rounded-xl w-[320px] h-[320px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
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
                  className="absolute flex flex-col items-center justify-center group motion-safe:transition-all motion-safe:duration-150 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}px`, top: `${y}px` }}
                  aria-label={item.label}
                >
                  <div className={`motion-safe:transition-all motion-safe:duration-150 ${
                    activeSection === item.href
                      ? "text-white scale-125"
                      : "text-[#666666] group-hover:text-white"
                  }`}>
                    {item.icon(32)}
                  </div>
                </button>
              );
            })}

            {/* Admin button — center of radial menu */}
            <button
              onClick={() => { setIsMenuOpen(false); goAdmin(); }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-[6px] bg-[#171717] text-[#666666] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] flex items-center justify-center hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15)] motion-safe:transition-all motion-safe:duration-150"
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
