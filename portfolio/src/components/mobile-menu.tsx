import { useEffect } from "react";
import { Home, User, Briefcase, Wrench, GraduationCap, Mail, Settings, Sun, Moon, X, type LucideIcon } from "lucide-react";
import { useTheme } from "../hooks/use-theme";

/** Icon-name (from navigation.json) → Lucide component. */
const ICONS: Record<string, LucideIcon> = {
  Home, User, Briefcase, Wrench, GraduationCap, Mail, Settings,
};

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const tileBase =
  "flex flex-col items-center justify-center gap-2 rounded-2xl aspect-square motion-safe:transition-all cursor-pointer";
const labelBase = "font-mono text-[10px] font-medium tracking-wide";

/**
 * Mobile-only launchpad menu: a 3-column grid of icon+label tiles over a
 * blurred backdrop (inspired by the private-hub FloatingMenu). Holds the nav
 * links plus theme toggle and admin. Renders nothing when closed.
 */
export function MobileMenu({
  open,
  onClose,
  items,
  activeSection,
  onNavigate,
  onAdmin,
}: {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  activeSection: string;
  onNavigate: (href: string) => void;
  onAdmin: () => void;
}) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  // Esc to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const go = (href: string) => { onNavigate(href); onClose(); };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 md:hidden"
      onClick={onClose}
      aria-label="Close menu"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200" />

      {/* Popup */}
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="relative w-full max-w-xs bg-card ring-line rounded-3xl shadow-card p-4 animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 h-9 w-9 inline-flex items-center justify-center rounded-full bg-card ring-line text-foreground hover:ring-strong shadow-card motion-safe:transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* 3-column launchpad grid */}
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => {
            const Icon = ICONS[item.icon] ?? Home;
            const active = activeSection === item.href;
            return (
              <button
                key={item.href}
                onClick={() => go(item.href)}
                aria-current={active ? "page" : undefined}
                className={`${tileBase} ${active ? "bg-brand/10 ring-1 ring-brand/30" : "ring-1 ring-transparent hover:bg-secondary"}`}
              >
                <Icon size={24} strokeWidth={1.75} className={active ? "text-brand" : "text-foreground/70"} />
                <span className={`${labelBase} ${active ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
              </button>
            );
          })}

          {/* Theme toggle — stays open so the change is visible */}
          <button
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`${tileBase} ring-1 ring-transparent hover:bg-secondary`}
          >
            {isDark
              ? <Sun size={24} strokeWidth={1.75} className="text-foreground/70" />
              : <Moon size={24} strokeWidth={1.75} className="text-foreground/70" />}
            <span className={`${labelBase} text-muted-foreground`}>Theme</span>
          </button>

          {/* Admin */}
          <button
            onClick={() => { onClose(); onAdmin(); }}
            className={`${tileBase} ring-1 ring-transparent hover:bg-secondary`}
          >
            <Settings size={24} strokeWidth={1.75} className="text-foreground/70" />
            <span className={`${labelBase} text-muted-foreground`}>Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
