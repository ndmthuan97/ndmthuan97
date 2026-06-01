import { useState, useCallback, useRef, useEffect } from "react";
import { Plus, Trash2, Edit3, Star, FileInput, GitCommit, X, ChevronDown, ChevronUp, Upload, Copy, Check, FolderGit2, User, FileText, Wrench, GraduationCap, Mail, LogOut } from "lucide-react";
import initialData from "../../data/projects.json";
import type { PortfolioItem } from "../../types/portfolio";
import { assetPath } from "../../utils/asset-path";
import { commitToGitHub } from "../../hooks/use-github";
import { logout } from "../../lib/admin-session";
import { BLANK_ITEM, ItemForm } from "./ItemForm";
import { ContentSettings, type ContentSection } from "./content-settings";
import { useToast, ToastStack } from "./toast";

type AdminView = "projects" | ContentSection;

const FEATURED_MAX = 3;

const NAV_GROUPS: { heading: string; items: { key: AdminView; label: string; icon: typeof User }[] }[] = [
  { heading: "Work", items: [{ key: "projects", label: "Projects", icon: FolderGit2 }] },
  {
    heading: "Page content",
    items: [
      { key: "home", label: "Home", icon: User },
      { key: "about", label: "About", icon: FileText },
      { key: "skills", label: "Skills", icon: Wrench },
      { key: "education", label: "Education", icon: GraduationCap },
      { key: "contact", label: "Contact", icon: Mail },
    ],
  },
];

// ─── Import JSON Modal ────────────────────────────────────────────────────────
const JSON_SAMPLE = `[
  {
    "id": 1234567890,
    "title": "Project Name",
    "description": "A short one-sentence description.",
    "image": "/project-image.png",
    "category": ["web", "ai"],
    "role": "Full-Stack Developer",
    "year": "2025",
    "demoUrl": "https://example.com",
    "overview": "2-3 sentences about the project...",
    "highlights": [
      "Short bullet shown on the card",
      "Another quick-scan highlight"
    ],
    "features": [
      "🔐 Authentication: JWT-based login",
      "📊 Dashboard: Real-time analytics"
    ],
    "links": [
      { "label": "GitHub", "url": "https://github.com/user/repo" }
    ],
    "technologies": {
      "backend": [".NET", "PostgreSQL"],
      "frontend": ["React", "TypeScript", "TailwindCSS"],
      "thirdParty": ["Vercel"]
    },
    "githubRepo": "username/repo-name"
  }
]`;

function ImportJsonModal({
  onImport,
  onClose,
}: {
  onImport: (text: string) => void;
  onClose: () => void;
}) {
  const [pasteText, setPasteText] = useState("");
  const [parseError, setParseError] = useState("");
  const [showSample, setShowSample] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopySample = () => {
    void navigator.clipboard.writeText(JSON_SAMPLE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePasteImport = () => {
    const trimmed = pasteText.trim();
    if (!trimmed) return;
    try {
      JSON.parse(trimmed); // validate before passing up
      setParseError("");
      onImport(trimmed);
    } catch {
      setParseError("Invalid JSON — check syntax and try again");
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        JSON.parse(text);
        setParseError("");
        onImport(text);
      } catch {
        setParseError("Invalid JSON file — check syntax and try again");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-foreground/40 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card shadow-card rounded-2xl flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold text-foreground">Import JSON</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-secondary rounded-md motion-safe:transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Paste section */}
          <div className="space-y-2">
            <label htmlFor="import-json-paste" className="mono-label text-muted-foreground">
              Paste JSON
            </label>
            <textarea
              id="import-json-paste"
              value={pasteText}
              onChange={(e) => { setPasteText(e.target.value); setParseError(""); }}
              rows={10}
              placeholder={`[\n  { "title": "My Project", ... }\n]`}
              className={`w-full bg-secondary rounded-lg px-3 py-2.5 text-[11px] text-foreground font-mono placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed motion-safe:transition-all ${
                parseError ? "ring-2 ring-red-500" : "ring-line focus:ring-strong"
              }`}
            />
            {parseError && <p className="text-red-500 text-[11px]">{parseError}</p>}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="mono-label text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* File pick */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary ring-line hover:ring-strong rounded-lg text-sm font-medium motion-safe:transition-all cursor-pointer"
            >
              <Upload size={14} />
              Choose JSON file
            </button>
          </div>

          {/* Format reference (collapsible) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSample((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground motion-safe:transition-colors cursor-pointer"
              >
                <ChevronDown
                  size={13}
                  className={`motion-safe:transition-transform ${showSample ? "rotate-180" : ""}`}
                />
                Format reference
              </button>
              {showSample && (
                <button
                  type="button"
                  onClick={handleCopySample}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground motion-safe:transition-colors cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            {showSample && (
              <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap break-words bg-secondary ring-line rounded-lg p-3 max-h-48 overflow-y-auto">
                {JSON_SAMPLE}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handlePasteImport}
            disabled={!pasteText.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-foreground hover:opacity-90 text-background font-medium text-sm rounded-md motion-safe:transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function AdminPanel() {
  const [items, setItems] = useState<PortfolioItem[]>(initialData.items as PortfolioItem[]);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [view, setView] = useState<AdminView>("projects");
  // True when project edits/deletes/imports are not yet committed to GitHub.
  const [dirty, setDirty] = useState(false);
  const { toasts, toast } = useToast();

  // Warn before leaving/closing the tab while there are uncommitted changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleSave = useCallback((updated: PortfolioItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
    setDirty(true);
    setEditing(null);
  }, []);

  const handleDelete = (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDirty(true);
    toast("info", `✓ Deleted "${title}" — commit to save`);
  };

  const handleLogout = () => {
    if (dirty && !window.confirm("You have uncommitted changes. Log out anyway?")) return;
    logout();
    window.location.hash = "";
    window.location.reload();
  };

  const handleToggleFeatured = async (id: number) => {
    const target = items.find((i) => i.id === id);
    const alreadyFeatured = target?.featured;
    const featuredCount = items.filter((i) => i.featured).length;
    if (!alreadyFeatured && featuredCount >= FEATURED_MAX) {
      toast("error", `Tối đa ${FEATURED_MAX} dự án featured`, "Bỏ chọn 1 dự án trước khi thêm cái mới.");
      return;
    }
    const nextItems = items.map((i) => (i.id === id ? { ...i, featured: !alreadyFeatured } : i));
    setItems(nextItems);
    const title = target?.title ?? "";
    toast("info", alreadyFeatured ? `Bỏ featured "${title}"` : `⭐ "${title}" đã featured (trang đầu)`);
    setSaving(true);
    const json = JSON.stringify({ filters: initialData.filters, items: nextItems }, null, 4);
    const result = await commitToGitHub(json);
    setSaving(false);
    // This commit writes the whole list, so any pending edits are now saved too.
    if (result.ok) setDirty(false);
    else toast("error", "⚠ Featured not saved to GitHub", result.message);
  };

  const buildJson = () => JSON.stringify({ filters: initialData.filters, items }, null, 4);

  // Persist a reordered list to GitHub (used by drag-free move up/down).
  const persistItems = async (nextItems: PortfolioItem[]) => {
    setSaving(true);
    const json = JSON.stringify({ filters: initialData.filters, items: nextItems }, null, 4);
    const result = await commitToGitHub(json);
    setSaving(false);
    if (result.ok) setDirty(false);
    else toast("error", "⚠ Order not saved to GitHub", result.message);
  };

  // Move a project one step toward the start ("up") or end ("down") of the list.
  // Display order follows array order (featured float to the front, keeping their
  // relative order), so this controls whether a project shows earlier or later.
  const handleMove = (id: number, direction: "up" | "down") => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
    void persistItems(next);
  };

  const handleImportJson = (text: string) => {
    try {
      const raw = JSON.parse(text);
      const incoming: PortfolioItem[] = Array.isArray(raw) ? raw : (raw.items ?? []);
      if (!incoming.length) { toast("error", "JSON không hợp lệ — không tìm thấy items"); return; }
      setItems((prev) => {
        const merged = [...prev];
        for (const p of incoming) {
          const idx = merged.findIndex((x) => x.id === p.id || x.title === p.title);
          if (idx >= 0) merged[idx] = { ...merged[idx], ...p };
          else merged.unshift({ ...p, id: p.id || Date.now() + Math.random() });
        }
        return merged;
      });
      setShowImportModal(false);
      setDirty(true);
      toast("success", `✓ Imported ${incoming.length} project(s) — commit to save`);
    } catch {
      toast("error", "Lỗi parse JSON — kiểm tra lại định dạng file");
    }
  };

  const handleCommit = async () => {
    setSaving(true);
    const result = await commitToGitHub(buildJson());
    setSaving(false);
    if (result.ok) setDirty(false);
    toast(result.ok ? "success" : "error", result.message);
  };

  const activeLabel = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === view)?.label ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-base font-bold text-foreground">Portfolio Admin</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {view === "projects" ? `${items.length} projects` : `Editing: ${activeLabel}`}
              {view === "projects" && dirty && (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> unsaved changes
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {view === "projects" && (
              <>
                <button
                  onClick={() => setEditing({ ...BLANK_ITEM, id: 0 })}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-foreground hover:opacity-90 text-background text-sm font-medium rounded-md motion-safe:transition-all active:scale-95 cursor-pointer"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">Add Project</span>
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-secondary ring-line hover:ring-strong text-sm font-medium rounded-md motion-safe:transition-all cursor-pointer"
                >
                  <FileInput size={14} />
                  <span className="hidden sm:inline">Import JSON</span>
                </button>

                <button
                  onClick={handleCommit}
                  disabled={saving || !dirty}
                  title={dirty ? "Commit changes to GitHub" : "No changes to commit"}
                  className={`relative flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium rounded-md motion-safe:transition-all disabled:opacity-40 cursor-pointer ${
                    dirty
                      ? "bg-amber-500 hover:opacity-90 text-white ring-1 ring-amber-500"
                      : "bg-secondary ring-line hover:ring-strong"
                  }`}
                >
                  <GitCommit size={14} />
                  <span className="hidden sm:inline">{saving ? "Saving..." : dirty ? "Commit*" : "Commit"}</span>
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              title="Log out"
              className="flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md motion-safe:transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar + content */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <nav className="md:w-56 shrink-0 md:sticky md:top-24 self-start">
          <div className="flex md:flex-col gap-4 md:gap-5 overflow-x-auto md:overflow-visible">
            {NAV_GROUPS.map((group) => (
              <div key={group.heading} className="md:space-y-1">
                <p className="mono-label text-muted-foreground mb-1.5 hidden md:block">{group.heading}</p>
                <div className="flex md:flex-col gap-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = view === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setView(item.key)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap motion-safe:transition-colors cursor-pointer ${
                          active
                            ? "bg-secondary text-foreground ring-line"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        }`}
                      >
                        <Icon size={15} className={active ? "text-brand" : ""} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {view === "projects" ? (
            <div className="space-y-3">
              {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-start gap-3 surface surface-hover rounded-xl p-3 sm:p-4 group"
          >
            {/* Reorder controls */}
            <div className="flex flex-col items-center gap-0.5 shrink-0 self-center">
              <button
                onClick={() => handleMove(item.id, "up")}
                disabled={index === 0 || saving}
                title="Move up (show earlier)"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary motion-safe:transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronUp size={15} />
              </button>
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums select-none">{index + 1}</span>
              <button
                onClick={() => handleMove(item.id, "down")}
                disabled={index === items.length - 1 || saving}
                title="Move down (show later)"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary motion-safe:transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronDown size={15} />
              </button>
            </div>

            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-md overflow-hidden bg-secondary ring-line">
              {item.image ? (
                <img src={assetPath(item.image)} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">📁</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <p className="font-semibold text-foreground truncate text-sm">{item.title}</p>
                    {item.featured && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 rounded font-medium uppercase tracking-wide shrink-0">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.category.map((cat) => (
                      <span
                        key={cat}
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground ring-line uppercase"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => void handleToggleFeatured(item.id)}
                    className={`p-2 rounded-md motion-safe:transition-colors cursor-pointer ${
                      item.featured
                        ? "text-amber-500 bg-amber-500/10"
                        : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    }`}
                    title={item.featured ? "Unpin from featured" : "Set as featured"}
                  >
                    <Star size={15} fill={item.featured ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => setEditing(item)}
                    className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground motion-safe:transition-colors md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

              {items.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  <p className="text-4xl mb-2">📂</p>
                  <p>No projects yet. Add one above.</p>
                </div>
              )}
            </div>
          ) : (
            <ContentSettings section={view} toast={toast} />
          )}
        </div>
      </div>

      {editing && (
        <ItemForm
          item={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          toast={toast}
          existingItems={items.filter((p) => p.id !== editing.id)}
        />
      )}
      {showImportModal && (
        <ImportJsonModal
          onImport={handleImportJson}
          onClose={() => setShowImportModal(false)}
        />
      )}
      <ToastStack toasts={toasts} />
    </div>
  );
}
