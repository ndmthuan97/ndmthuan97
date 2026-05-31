import { useState } from "react";
import { Menu, X, Settings } from "lucide-react";
import navData from "../data/navigation.json";
import { assetPath } from "../utils/asset-path";
import { ThemeToggle } from "./theme-toggle";

const goAdmin = () => { window.location.hash = "admin"; };

export function TopNav({
  activeSection,
  onNavigate,
}: {
  activeSection: string;
  onNavigate: (section: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const items = navData.navItems;

  const handle = (href: string) => {
    onNavigate(href);
    setOpen(false);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <nav
          className="mt-3 flex items-center justify-between gap-4 rounded-xl
            bg-background/70 backdrop-blur-xl ring-line px-3 md:px-4 h-14"
        >
          {/* Brand */}
          <button
            onClick={() => handle("home")}
            className="group flex items-center gap-2.5 cursor-pointer"
            aria-label="Go to home"
          >
            <img
              src={assetPath("/favicon.jpg")}
              alt="Minh Thuan logo"
              className="h-7 w-7 rounded-md object-cover ring-line"
            />
            <span className="font-display font-semibold tracking-tight text-[15px] hidden sm:block">
              Minh Thuan
            </span>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {items.map((item) => {
              const active = activeSection === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => onNavigate(item.href)}
                  className={`relative px-3 py-1.5 rounded-md text-sm motion-safe:transition-colors cursor-pointer ${
                    active
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute left-3 right-3 -bottom-0.5 h-px bg-brand" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={goAdmin}
              aria-label="Admin panel"
              title="Admin"
              className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-md
                ring-line text-foreground/50 hover:text-foreground hover:ring-strong
                motion-safe:transition-all cursor-pointer"
            >
              <Settings size={16} />
            </button>
            <ThemeToggle />
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md
                ring-line text-foreground motion-safe:transition-all cursor-pointer"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden mt-2 rounded-xl bg-background/95 backdrop-blur-xl shadow-card p-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {items.map((item) => {
              const active = activeSection === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => handle(item.href)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm motion-safe:transition-colors cursor-pointer ${
                    active
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => { setOpen(false); goAdmin(); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground motion-safe:transition-colors cursor-pointer"
            >
              <Settings size={15} /> Admin
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
