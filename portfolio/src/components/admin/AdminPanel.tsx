import { useState, useCallback, useRef } from "react";
import { Plus, Trash2, Edit3, Github, Download, Upload, X, Save, AlertCircle, ImagePlus } from "lucide-react";
import initialData from "../../data/portfolio.json";
import type { PortfolioItem } from "../../types/portfolio";

// ─── Config ──────────────────────────────────────────────────────────────────
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_PAT as string | undefined;
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO as string | undefined; // e.g. "ndmthuan97/ndmthuan97"
const FILE_PATH = "portfolio/src/data/portfolio.json";

// ─── GitHub Helpers ───────────────────────────────────────────────────────────
async function getFileSha(): Promise<string | null> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return null;
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) return null;
  const json = await res.json() as { sha: string };
  return json.sha;
}

async function commitToGitHub(content: string): Promise<{ ok: boolean; message: string }> {
  if (!GITHUB_TOKEN) return { ok: false, message: "VITE_GITHUB_PAT not set" };
  if (!GITHUB_REPO) return { ok: false, message: "VITE_GITHUB_REPO not set" };

  const sha = await getFileSha();
  const body: Record<string, unknown> = {
    message: "chore: update portfolio via admin panel",
    content: btoa(encodeURIComponent(content).replace(/%([0-9A-F]{2})/gi, (_, p) => String.fromCharCode(parseInt(p, 16)))),
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json() as { message: string };
    return { ok: false, message: err.message ?? res.statusText };
  }
  return { ok: true, message: "Committed successfully!" };
}

async function fetchGitHubRepo(repo: string) {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json() as Promise<{ name: string; description: string; language: string; topics: string[]; stargazers_count: number; html_url: string }>;
}

async function uploadImageToGitHub(file: File): Promise<{ ok: boolean; path?: string; message: string }> {
  if (!GITHUB_TOKEN) return { ok: false, message: "VITE_GITHUB_PAT not set" };
  if (!GITHUB_REPO) return { ok: false, message: "VITE_GITHUB_REPO not set" };

  const ext = file.name.split(".").pop() ?? "png";
  const filename = `${Date.now()}.${ext}`;
  const repoPath = `portfolio/public/${filename}`;

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${repoPath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `chore: upload project image ${filename}`,
        content: base64,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json() as { message: string };
    return { ok: false, message: err.message ?? res.statusText };
  }
  return { ok: true, path: `/${filename}`, message: "Uploaded!" };
}

// ─── Item Form ───────────────────────────────────────────────────────────────
const BLANK_ITEM: PortfolioItem = {
  id: Date.now(),
  image: "",
  title: "",
  description: "",
  overview: "",
  features: [],
  technicalDetails: {},
  links: [],
  category: [],
  technologies: {},
};

function ItemForm({
  item,
  onSave,
  onClose,
}: {
  item: PortfolioItem;
  onSave: (updated: PortfolioItem) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<PortfolioItem>(item);
  const [repoInput, setRepoInput] = useState(item.githubRepo ?? "");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    const result = await uploadImageToGitHub(file);
    if (result.ok && result.path) {
      update("image", result.path);
    } else {
      setUploadError(result.message);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const update = (field: keyof PortfolioItem, value: unknown) =>
    setDraft((d) => ({ ...d, [field]: value }));

  const handleImport = async () => {
    if (!repoInput.trim()) return;
    setImporting(true);
    setImportError("");
    try {
      const gh = await fetchGitHubRepo(repoInput.trim());
      setDraft((d) => ({
        ...d,
        githubRepo: repoInput.trim(),
        title: d.title || gh.name,
        description: d.description || gh.description || "",
        links: d.links.length
          ? d.links
          : [{ label: "Github", url: gh.html_url }],
      }));
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed");
    }
    setImporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-figma-header border border-figma-border rounded-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-figma-border/50">
          <h2 className="text-lg font-black text-foreground">
            {item.id === BLANK_ITEM.id ? "New Project" : `Edit: ${item.title}`}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-figma-card rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* GitHub Import */}
          <div className="flex gap-2">
            <input
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repo (e.g. ndmthuan97/Deca)"
              className="flex-1 bg-figma-card border border-figma-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-figma-accent/60 outline-none"
            />
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-1.5 px-3 py-2 bg-figma-skill border border-figma-border rounded-lg text-sm font-medium hover:border-figma-accent/50 transition-colors disabled:opacity-50"
            >
              <Github size={14} />
              {importing ? "Importing..." : "Import"}
            </button>
          </div>
          {importError && <p className="text-red-400 text-xs">{importError}</p>}

          {/* Basic Fields */}
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 space-y-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Title *</span>
              <input
                value={draft.title}
                onChange={(e) => update("title", e.target.value)}
                className="w-full bg-figma-card border border-figma-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-figma-accent/60 outline-none"
              />
            </label>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Image</span>
              <div className="flex gap-2">
                <input
                  value={draft.image}
                  onChange={(e) => update("image", e.target.value)}
                  placeholder="/project.png"
                  className="flex-1 bg-figma-card border border-figma-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-figma-accent/60 outline-none min-w-0"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-figma-skill border border-figma-border rounded-lg text-sm font-medium hover:border-figma-accent/50 transition-colors disabled:opacity-50 shrink-0"
                >
                  <ImagePlus size={14} />
                  {uploading ? "Uploading..." : "Upload"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                />
              </div>
              {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}
              {draft.image && (
                <img
                  src={draft.image}
                  alt="preview"
                  className="mt-1 h-20 w-auto rounded-lg border border-figma-border object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
            </div>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Category (comma separated)</span>
              <input
                value={draft.category.join(", ")}
                onChange={(e) => update("category", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                placeholder="backend, frontend"
                className="w-full bg-figma-card border border-figma-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-figma-accent/60 outline-none"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Description *</span>
            <textarea
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              rows={2}
              className="w-full bg-figma-card border border-figma-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-figma-accent/60 outline-none resize-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Overview</span>
            <textarea
              value={draft.overview ?? ""}
              onChange={(e) => update("overview", e.target.value)}
              rows={3}
              className="w-full bg-figma-card border border-figma-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-figma-accent/60 outline-none resize-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Features (one per line)</span>
            <textarea
              value={(draft.features ?? []).join("\n")}
              onChange={(e) => update("features", e.target.value.split("\n").filter(Boolean))}
              rows={4}
              className="w-full bg-figma-card border border-figma-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-figma-accent/60 outline-none resize-none font-mono text-xs"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Links (JSON array)</span>
            <textarea
              value={JSON.stringify(draft.links, null, 2)}
              onChange={(e) => {
                try { update("links", JSON.parse(e.target.value)); } catch {}
              }}
              rows={3}
              className="w-full bg-figma-card border border-figma-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-figma-accent/60 outline-none resize-none font-mono"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-figma-border/50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...draft, id: item.id || Date.now() })}
            disabled={!draft.title.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={14} /> Save
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
  const [status, setStatus] = useState<{ type: "success" | "error" | "idle"; msg: string }>({ type: "idle", msg: "" });
  const [saving, setSaving] = useState(false);

  const showStatus = (type: "success" | "error", msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus({ type: "idle", msg: "" }), 4000);
  };

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

  const handleDelete = (id: number) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const buildJson = () => {
    const data = {
      filters: initialData.filters,
      items,
    };
    return JSON.stringify(data, null, 4);
  };

  const handleDownload = () => {
    const blob = new Blob([buildJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCommit = async () => {
    setSaving(true);
    const result = await commitToGitHub(buildJson());
    setSaving(false);
    showStatus(result.ok ? "success" : "error", result.message);
  };

  return (
    <div className="min-h-screen bg-figma-bg text-foreground">
      {/* Top bar */}
      <div className="border-b border-figma-border bg-figma-header sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-black text-foreground">Portfolio Admin</h1>
            <p className="text-xs text-muted-foreground">{items.length} projects</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => setEditing({ ...BLANK_ITEM, id: Date.now() })}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-all active:scale-95"
            >
              <Plus size={14} /> Add Project
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 bg-figma-card border border-figma-border hover:border-figma-border-light text-sm font-medium rounded-lg transition-all"
            >
              <Download size={14} /> Download JSON
            </button>
            <button
              onClick={handleCommit}
              disabled={saving || !GITHUB_TOKEN}
              title={!GITHUB_TOKEN ? "Set VITE_GITHUB_PAT to enable direct commit" : ""}
              className="flex items-center gap-1.5 px-3 py-2 bg-figma-skill border border-figma-border hover:border-green-500/50 text-sm font-medium rounded-lg transition-all disabled:opacity-40"
            >
              <Upload size={14} />
              {saving ? "Saving..." : "Commit to GitHub"}
            </button>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.location.hash = ""; window.location.reload(); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-2"
            >
              ← Back to site
            </a>
          </div>
        </div>

        {/* Status bar */}
        {status.type !== "idle" && (
          <div className={`px-4 py-2 text-sm flex items-center gap-2 ${status.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
            <AlertCircle size={14} />
            {status.msg}
          </div>
        )}
      </div>

      {/* Security note for direct commit */}
      {GITHUB_TOKEN && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex items-start gap-2">
            <span>⚠️</span>
            <span>
              VITE_GITHUB_PAT is bundled in the frontend JS. Use a fine-grained PAT scoped to <strong>Contents: Write</strong> for this repo only.
            </span>
          </div>
        </div>
      )}

      {/* Item List */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 bg-figma-header border border-figma-border/50 hover:border-figma-border-light/50 rounded-xl p-4 transition-all group"
          >
            {/* Thumbnail */}
            <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-figma-skill border border-figma-border">
              {item.image ? (
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">📁</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-foreground truncate">{item.title}</p>
                {item.githubRepo && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-figma-skill border border-figma-border rounded text-muted-foreground font-mono">
                    {item.githubRepo}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              <div className="flex gap-1 mt-1.5">
                {item.category.map((cat) => (
                  <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-figma-accent border border-primary/30 font-bold uppercase">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(item)}
                className="p-2 rounded-lg hover:bg-figma-card text-muted-foreground hover:text-primary transition-colors"
                title="Edit"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
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

      {/* Edit Modal */}
      {editing && (
        <ItemForm item={editing} onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
