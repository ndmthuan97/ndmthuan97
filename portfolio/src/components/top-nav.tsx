import { useState } from "react";
import { Menu, Settings } from "lucide-react";
import navData from "../data/navigation.json";
import { assetPath } from "../utils/asset-path";
import { ThemeToggle } from "./theme-toggle";
import { MobileMenu } from "./mobile-menu";

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
    <>
      {/* Desktop top nav (mobile uses the floating menu below instead) */}
      <header className="fixed top-0 inset-x-0 z-50 hidden md:block">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <nav
            className="mt-3 flex items-center justify-between gap-4 rounded-xl
              bg-background/70 backdrop-blur-xl ring-line px-3 md:px-4 h-14"
          >
            {/* Brand */}
            <button
              onClick={() => handle("about")}
              className="group flex items-center gap-2.5 cursor-pointer"
              aria-label="Go to top"
            >
              <img
                src={assetPath("/favicon.jpg")}
                alt="Minh Thuan logo"
                className="h-7 w-7 rounded-md object-cover ring-line"
              />
              <span className="font-display font-semibold tracking-tight text-[15px]">
                Minh Thuan
              </span>
            </button>

            {/* Links */}
            <div className="flex items-center gap-1">
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-md
                  ring-line text-foreground/50 hover:text-foreground hover:ring-strong
                  motion-safe:transition-all cursor-pointer"
              >
                <Settings size={16} />
              </button>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile floating menu button — replaces the header on mobile */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="md:hidden fixed bottom-5 right-5 z-50 h-12 w-12 inline-flex items-center justify-center
          rounded-full bg-card ring-line shadow-card text-foreground hover:ring-strong
          active:scale-95 motion-safe:transition-all cursor-pointer"
      >
        <Menu size={20} />
      </button>

      {/* Mobile launchpad menu */}
      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        activeSection={activeSection}
        onNavigate={onNavigate}
        onAdmin={goAdmin}
      />
    </>
  );
}
