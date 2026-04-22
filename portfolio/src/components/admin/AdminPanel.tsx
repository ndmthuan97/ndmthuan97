import { useState, useCallback, useRef } from "react";
import { Plus, Trash2, Edit3, Star, FileInput, GitCommit, X, ChevronDown, Upload, Copy, Check } from "lucide-react";
import initialData from "../../data/portfolio.json";
import type { PortfolioItem } from "../../types/portfolio";
import { assetPath } from "../../utils/asset-path";
import { GITHUB_TOKEN, commitToGitHub } from "../../hooks/use-github";
import { BLANK_ITEM, ItemForm } from "./ItemForm";
import { useToast, ToastStack } from "./toast";

// ─── Import JSON Modal ────────────────────────────────────────────────────────
const JSON_SAMPLE = `[
  {
    "id": 1234567890,
    "title": "Project Name",
    "description": "A short one-sentence description.",
    "image": "/project-image.png",
    "category": ["frontend", "backend"],
    "overview": "2-3 sentences about the project...",
    "features": [
      "🔐 Authentication: JWT-based login",
      "📊 Dashboard: Real-time analytics"
    ],
    "links": [
      { "label": "GitHub", "url": "https://github.com/user/repo" },
      { "label": "Live Demo", "url": "https://example.com" }
    ],
    "technologies": {
      "frontend": ["React", "TypeScript", "Tailwind"],
      "backend": [".NET 8", "PostgreSQL"],
      "thirdParty": ["Vercel"]
    },
    "technicalDetails": {
      "frontend": ["Built with React 19 and TypeScript..."],
      "backend": ["REST API using .NET 8 minimal APIs..."]
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
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#111111] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_64px_rgba(0,0,0,0.7)] rounded-2xl flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h3 className="text-sm font-bold text-foreground">Import JSON</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#262626] rounded-[6px] motion-safe:transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Paste section */}
          <div className="space-y-2">
            <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              Paste JSON
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => { setPasteText(e.target.value); setParseError(""); }}
              rows={10}
              placeholder={`[\n  { "title": "My Project", ... }\n]`}
              className={`w-full bg-[#0a0a0a] rounded-[8px] px-3 py-2.5 text-[11px] text-foreground font-mono placeholder:text-[#444] focus:outline-none resize-none leading-relaxed motion-safe:transition-all ${
                parseError
                  ? "shadow-[0_0_0_1px_rgba(248,113,113,0.5)]"
                  : "shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)]"
              }`}
            />
            {parseError && <p className="text-red-400 text-[11px]">{parseError}</p>}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[10px] text-[#444] font-bold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/8" />
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] rounded-[8px] text-sm font-medium motion-safe:transition-all"
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
                className="flex items-center gap-1.5 text-[11px] text-[#555] hover:text-[#888] motion-safe:transition-colors"
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
                  className="flex items-center gap-1 text-[11px] text-[#555] hover:text-white motion-safe:transition-colors"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            {showSample && (
              <pre className="text-[10px] text-[#666] font-mono leading-relaxed whitespace-pre-wrap break-words bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.06)] rounded-[8px] p-3 max-h-48 overflow-y-auto">
                {JSON_SAMPLE}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/8 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePasteImport}
            disabled={!pasteText.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-white/90 text-[#0a0a0a] font-bold text-sm rounded-[6px] motion-safe:transition-all active:scale-95 disabled:opacity-40"
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
  const { toasts, toast } = useToast();

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
    setEditing(null);
  }, []);

  const handleDelete = (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast("info", `✓ Deleted "${title}"`);
  };

  const handleToggleFeatured = async (id: number) => {
    const target = items.find((i) => i.id === id);
    const alreadyFeatured = target?.featured;
    const nextItems = items.map((i) => ({ ...i, featured: alreadyFeatured ? false : i.id === id }));
    setItems(nextItems);
    const title = target?.title ?? "";
    toast("info", alreadyFeatured ? `Unpinned "${title}"` : `⭐ "${title}" set as featured`);
    if (!GITHUB_TOKEN) return;
    setSaving(true);
    const json = JSON.stringify({ filters: initialData.filters, items: nextItems }, null, 4);
    const result = await commitToGitHub(json);
    setSaving(false);
    if (!result.ok) toast("error", "⚠ Featured not saved to GitHub", result.message);
  };

  const buildJson = () => JSON.stringify({ filters: initialData.filters, items }, null, 4);

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
      toast("success", `✓ Imported ${incoming.length} project(s) from JSON`);
    } catch {
      toast("error", "Lỗi parse JSON — kiểm tra lại định dạng file");
    }
  };

  const handleCommit = async () => {
    setSaving(true);
    const result = await commitToGitHub(buildJson());
    setSaving(false);
    toast(result.ok ? "success" : "error", result.message);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground">
      {/* Top bar */}
      <div className="border-b border-white/8 bg-[#111111] sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-black text-foreground">Portfolio Admin</h1>
            <p className="text-xs text-muted-foreground">{items.length} projects</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setEditing({ ...BLANK_ITEM, id: 0 })}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-white hover:bg-white/90 text-[#0a0a0a] text-sm font-bold rounded-[6px] motion-safe:transition-all active:scale-95"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add Project</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] text-sm font-medium rounded-[6px] motion-safe:transition-all"
            >
              <FileInput size={14} />
              <span className="hidden sm:inline">Import JSON</span>
            </button>

            <button
              onClick={handleCommit}
              disabled={saving || !GITHUB_TOKEN}
              title={!GITHUB_TOKEN ? "Set VITE_GITHUB_PAT to enable direct commit" : "Commit to GitHub"}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(74,222,128,0.4)] text-sm font-medium rounded-[6px] motion-safe:transition-all disabled:opacity-40"
            >
              <GitCommit size={14} />
              <span className="hidden sm:inline">{saving ? "Saving..." : "Commit"}</span>
            </button>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.location.hash = ""; window.location.reload(); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-2 hidden sm:block"
            >
              ← Back
            </a>
          </div>
        </div>
      </div>

      {/* Item List */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 bg-[#111111] shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15)] rounded-xl p-3 sm:p-4 motion-safe:transition-all group"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-[6px] overflow-hidden bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
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
                    <p className="font-bold text-foreground truncate text-sm">{item.title}</p>
                    {item.featured && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.3)] rounded font-bold uppercase tracking-wide shrink-0">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.category.map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.2)] font-bold uppercase"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => void handleToggleFeatured(item.id)}
                    className={`p-2 rounded-[6px] motion-safe:transition-colors ${
                      item.featured
                        ? "text-amber-400 bg-amber-500/10"
                        : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    }`}
                    title={item.featured ? "Unpin from featured" : "Set as featured"}
                  >
                    <Star size={15} fill={item.featured ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => setEditing(item)}
                    className="p-2 rounded-[6px] hover:bg-[#262626] text-muted-foreground hover:text-white motion-safe:transition-colors md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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
