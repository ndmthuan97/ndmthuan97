import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, Save, ImagePlus, Sparkles } from "lucide-react";
import { z } from "zod";
import type { PortfolioItem } from "../../types/portfolio";
import { assetPath } from "../../utils/asset-path";
import {
  GITHUB_REPO,
  type GithubRepoData,
  type RepoOption,
  parseRepoInput,
  deriveCategory,
  fetchUserRepos,
  fetchGitHubRepo,
  fetchRepoReadme,
  uploadImageToGitHub,
} from "../../hooks/use-github";
import { HAS_AI, generateProjectContent } from "../../hooks/use-ai-generation";
import type { ToastMsg } from "./toast";

const draftSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

type DraftErrors = Partial<Record<keyof z.infer<typeof draftSchema>, string>>;

export const BLANK_ITEM: PortfolioItem = {
  id: 0,
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

export function ItemForm({
  item,
  onSave,
  onClose,
  toast,
  existingItems,
}: {
  item: PortfolioItem;
  onSave: (updated: PortfolioItem) => void;
  onClose: () => void;
  toast: (type: ToastMsg["type"], text: string, detail?: string) => void;
  existingItems: PortfolioItem[];
}) {
  const initRepos = (): string[] => {
    if (item.githubRepos?.length) return item.githubRepos;
    if (item.githubRepo) return [item.githubRepo];
    return [""];
  };

  const [draft, setDraft] = useState<PortfolioItem>(item);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [repoInputs, setRepoInputs] = useState<string[]>(initRepos);
  const [importingIdx, setImportingIdx] = useState<number | null>(null);
  const [importError, setImportError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);
  const [repoOptions, setRepoOptions] = useState<RepoOption[]>([]);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerTab, setPickerTab] = useState<"all" | "owner" | "contributed">("all");
  const [linksError, setLinksError] = useState("");
  const [techError, setTechError] = useState("");
  const [techDetailsError, setTechDetailsError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const githubDataListRef = useRef<GithubRepoData[]>([]);
  const repoCacheRef = useRef<RepoOption[] | null>(null);
  const pendingImageRef = useRef<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const pendingPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (pendingPreviewRef.current) URL.revokeObjectURL(pendingPreviewRef.current);
    };
  }, []);

  // Keep ref in sync so cleanup effect always has latest value
  useEffect(() => { pendingPreviewRef.current = pendingPreview; }, [pendingPreview]);

  const newAbort = () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    return ctrl.signal;
  };

  const handleImageSelect = (file: File) => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    pendingImageRef.current = file;
    setPendingPreview(URL.createObjectURL(file));
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
    setPendingName(base);
    setUploadError("");
  };

  const update = (field: keyof PortfolioItem, value: unknown) => {
    setDraft((d) => ({ ...d, [field]: value }));
    if (field in errors) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleGenerate = useCallback(async (
    titleOverride?: string,
    descOverride?: string,
    repoDataOverride?: GithubRepoData[]
  ) => {
    const title = (typeof titleOverride === "string" ? titleOverride : undefined) ?? draft.title;
    if (!title.trim()) return;
    const signal = newAbort();
    setGenerating(true);
    setGenerateError("");
    try {
      const result = await generateProjectContent(
        title,
        descOverride ?? draft.description,
        repoDataOverride ?? githubDataListRef.current,
        existingItems.filter((p) => p.id !== item.id),
        signal,
      );
      setDraft((d) => ({
        ...d,
        description: result.description,
        overview: result.overview,
        features: result.features,
        ...(result.technicalDetails && { technicalDetails: result.technicalDetails }),
        ...(result.technologies && { technologies: result.technologies }),
      }));
      toast("success", `✨ Generated via ${result._provider}`);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      const msg = e instanceof Error ? e.message : "AI generation failed";
      setGenerateError(msg);
      let detail = msg;
      if (msg.includes("API_KEY") || msg.includes("API key") || msg.includes("403")) {
        detail = "Nguyên nhân: API key sai hoặc chưa có quyền.\n→ Kiểm tra VITE_GROQ_API_KEY tại console.groq.com hoặc VITE_GEMINI_API_KEY tại aistudio.google.com";
      } else if (msg.includes("quota") || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("rate_limit")) {
        detail = "Nguyên nhân: Hết quota (Groq: 500 req/ngày, Gemini: rate limit).\n→ Chờ vài phút, hệ thống sẽ tự fallback sang provider khác.";
      } else if (msg.includes("responseMimeType") || msg.includes("Cannot find field")) {
        detail = "Nguyên nhân: API version không hỗ trợ JSON mode.\n→ Đã được fix, thử lại sau khi reload trang.";
      } else if (msg.includes("model") && msg.includes("not found")) {
        detail = "Nguyên nhân: Model không tồn tại hoặc chưa được kích hoạt.\n→ Thử lại — sẽ tự fallback sang model khác.";
      } else if (msg.includes("400")) {
        detail = "Nguyên nhân: Request không hợp lệ (400).\n→ Kiểm tra nội dung prompt có ký tự đặc biệt không.";
      }
      toast("error", "⚠ AI Generate thất bại", detail);
    }
    setGenerating(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.title, draft.description, existingItems, item.id, toast]);

  const handleImport = async (idx: number, repoOverride?: string, autoGenerate = false) => {
    const repo = repoOverride ?? parseRepoInput(repoInputs[idx] ?? "");
    if (!repo) return;
    const signal = newAbort();
    setImportingIdx(idx);
    setImportError("");
    let importedTitle = "";
    let importedDesc = "";
    let importedRepoData: GithubRepoData[] = [];
    try {
      const [gh, readme] = await Promise.all([
        fetchGitHubRepo(repo, signal),
        fetchRepoReadme(repo, signal),
      ]);
      const newEntry: GithubRepoData = {
        repo,
        description: gh.description ?? undefined,
        language: gh.language ?? undefined,
        topics: gh.topics,
        readme: readme ?? undefined,
      };
      githubDataListRef.current = [
        ...githubDataListRef.current.filter((d) => d.repo !== repo),
        newEntry,
      ];
      importedRepoData = githubDataListRef.current;
      const repos = repoInputs.map((r, i) => (i === idx ? repo : r)).filter(Boolean);
      setDraft((d) => {
        importedTitle = d.title || gh.name;
        importedDesc = d.description || gh.description || "";
        const topicCategory = deriveCategory(gh.topics ?? []);
        return {
          ...d,
          githubRepos: repos,
          githubRepo: repos[0],
          ...(idx === 0 && {
            title: importedTitle,
            description: importedDesc,
            category: d.category.length ? d.category : topicCategory as PortfolioItem["category"],
            links: d.links.length ? d.links : [{ label: "Github", url: gh.html_url }],
          }),
          ...(idx > 0 && {
            links: d.links.some((l) => l.url === gh.html_url)
              ? d.links
              : [...d.links, { label: `Github (${gh.name})`, url: gh.html_url }],
          }),
        };
      });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") { setImportingIdx(null); return; }
      setImportError(e instanceof Error ? e.message : "Import failed");
      setImportingIdx(null);
      return;
    }
    setImportingIdx(null);
    if (autoGenerate && idx === 0 && HAS_AI) {
      await handleGenerate(importedTitle, importedDesc, importedRepoData);
    } else if (idx === 0) {
      toast("success", `✓ Imported ${importedTitle}`);
    }
  };

  const setRepo = (idx: number, val: string) =>
    setRepoInputs((prev) => prev.map((r, i) => (i === idx ? val : r)));

  const addRepo = () => setRepoInputs((prev) => [...prev, ""]);

  const removeRepo = (idx: number) => {
    setRepoInputs((prev) => prev.filter((_, i) => i !== idx));
    githubDataListRef.current = githubDataListRef.current.filter((_, i) => i !== idx);
  };

  const openPicker = async (idx: number) => {
    if (pickerIdx === idx) { setPickerIdx(null); return; }
    setPickerIdx(idx);
    setPickerQuery("");
    setPickerTab("all");
    if (repoCacheRef.current || loadingPicker) {
      if (repoCacheRef.current) setRepoOptions(repoCacheRef.current);
      return;
    }
    const owner = GITHUB_REPO?.split("/")[0];
    if (!owner) return;
    setLoadingPicker(true);
    try {
      const signal = newAbort();
      const repos = await fetchUserRepos(owner, signal);
      repoCacheRef.current = repos;
      setRepoOptions(repos);
    } catch { /* ignore */ }
    setLoadingPicker(false);
  };

  const selectRepo = (idx: number, option: RepoOption) => {
    setRepo(idx, option.full_name);
    setPickerIdx(null);
    void handleImport(idx, option.full_name, true);
  };

  const filteredRepos = repoOptions.filter((r) => {
    const matchesTab = pickerTab === "all" || r.type === pickerTab;
    const matchesQuery =
      !pickerQuery ||
      r.name.toLowerCase().includes(pickerQuery.toLowerCase()) ||
      r.full_name.toLowerCase().includes(pickerQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const ownedCount = repoOptions.filter((r) => r.type === "owner").length;
  const contributedCount = repoOptions.filter((r) => r.type === "contributed").length;

  const handleSave = async () => {
    const validation = draftSchema.safeParse(draft);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0],
        description: fieldErrors.description?.[0],
      });
      return;
    }

    setUploading(true);
    let imagePath = draft.image;
    if (pendingImageRef.current) {
      const signal = newAbort();
      const result = await uploadImageToGitHub(pendingImageRef.current, pendingName || undefined, signal);
      if (!result.ok) {
        setUploadError(result.message);
        setUploading(false);
        toast("error", "⚠ Image upload failed — project not saved", result.message);
        return;
      }
      imagePath = result.path ?? imagePath;
      pendingImageRef.current = null;
      if (pendingPreview) { URL.revokeObjectURL(pendingPreview); setPendingPreview(null); }
    }
    setUploading(false);
    const repos = repoInputs.filter(Boolean);
    onSave({
      ...draft,
      image: imagePath,
      id: item.id || Date.now(),
      githubRepos: repos.length > 1 ? repos : undefined,
      githubRepo: repos[0] ?? draft.githubRepo,
      category: draft.category as PortfolioItem["category"],
    });
    toast(item.id === 0 ? "success" : "info", item.id === 0 ? "✓ Project created" : "✓ Changes saved");
  };

  const inputCls = (hasError?: boolean) =>
    `w-full bg-[#0a0a0a] rounded-[6px] px-3 py-2.5 text-sm text-foreground placeholder:text-[#444] focus:outline-none resize-none motion-safe:transition-all ${
      hasError
        ? "shadow-[0_0_0_1px_rgba(248,113,113,0.5)]"
        : "shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)]"
    }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="w-full sm:max-w-5xl bg-[#111111] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_64px_rgba(0,0,0,0.7)] sm:rounded-2xl rounded-t-2xl flex flex-col"
        style={{ maxHeight: "95dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-black text-foreground">
              {item.id === 0 ? "New Project" : `Edit: ${item.title}`}
            </h2>
            {(importingIdx !== null || generating) && (
              <span className="flex items-center gap-1.5 text-xs text-[#666666]">
                <span className="w-3 h-3 rounded-full border-2 border-[#444] border-t-white animate-spin inline-block" />
                {importingIdx !== null ? "Importing..." : "Generating..."}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {HAS_AI && (
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={generating || !draft.title.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 hover:bg-white/15 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)] rounded-[6px] text-xs font-semibold motion-safe:transition-all disabled:opacity-40"
              >
                <Sparkles size={12} className={generating ? "animate-spin" : ""} />
                {generating ? "Generating..." : "AI Generate"}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#262626] rounded-[6px] motion-safe:transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden">

          {/* LEFT: Config panel */}
          <div className="md:w-68 shrink-0 md:border-r border-b md:border-b-0 border-white/8 flex flex-col md:overflow-y-auto p-4 sm:p-5 gap-5">

            {/* GitHub Repos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">GitHub Repos</span>
                <button
                  type="button"
                  onClick={addRepo}
                  className="text-xs text-[#555] hover:text-white motion-safe:transition-colors flex items-center gap-1"
                >
                  <Plus size={11} /> Add
                </button>
              </div>
              {pickerIdx !== null && (
                <div className="fixed inset-0 z-40" onClick={() => setPickerIdx(null)} />
              )}
              {repoInputs.map((repo, idx) => (
                <div key={idx} className="relative flex flex-col gap-1">
                  <div className="flex gap-1.5">
                    <input
                      value={repo}
                      onChange={(e) => { setRepo(idx, e.target.value); setPickerQuery(e.target.value); }}
                      onFocus={() => void openPicker(idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setPickerIdx(null);
                        if (e.key === "Enter") { setPickerIdx(null); void handleImport(idx, undefined, idx === 0); }
                      }}
                      placeholder={idx === 0 ? "Click to browse..." : "owner/repo"}
                      className="flex-1 min-w-0 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-2.5 py-1.5 text-xs text-foreground placeholder:text-[#555] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none motion-safe:transition-all"
                    />
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => removeRepo(idx)}
                        className="p-1.5 text-[#555] hover:text-red-400 motion-safe:transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  {pickerIdx === idx && (
                    <div className="relative z-50 bg-[#1a1a1a] shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_8px_32px_rgba(0,0,0,0.7)] rounded-[8px] overflow-hidden">
                      {!loadingPicker && repoOptions.length > 0 && (
                        <div className="flex border-b border-white/8">
                          {(["all", "owner", "contributed"] as const).map((tab) => {
                            const label =
                              tab === "all"
                                ? `All (${repoOptions.length})`
                                : tab === "owner"
                                ? `Mine (${ownedCount})`
                                : `Fork (${contributedCount})`;
                            return (
                              <button
                                key={tab}
                                type="button"
                                onClick={() => setPickerTab(tab)}
                                className={`flex-1 py-1.5 text-[10px] font-bold motion-safe:transition-colors ${
                                  pickerTab === tab
                                    ? "text-white border-b-2 border-white -mb-px"
                                    : "text-[#555] hover:text-white"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className="max-h-48 overflow-y-auto">
                        {loadingPicker ? (
                          <p className="text-xs text-[#555] px-3 py-4 text-center">Loading...</p>
                        ) : filteredRepos.length === 0 ? (
                          <p className="text-xs text-[#555] px-3 py-4 text-center">No repos found</p>
                        ) : (
                          filteredRepos.map((r) => (
                            <button
                              key={r.full_name}
                              type="button"
                              onClick={() => selectRepo(idx, r)}
                              className="w-full text-left px-3 py-2 hover:bg-white/5 motion-safe:transition-colors flex items-start gap-2"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-white font-medium block truncate">{r.name}</span>
                                {r.description && (
                                  <span className="text-[10px] text-[#555] truncate block">{r.description}</span>
                                )}
                              </div>
                              {r.type === "contributed" && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-white/8 text-[#777] shrink-0 mt-0.5">
                                  fork
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {importError && <p className="text-red-400 text-[11px]">{importError}</p>}
            </div>

            {/* Image */}
            <div className="space-y-2">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Image</span>
              <div className="flex gap-1.5">
                <input
                  value={pendingPreview ? "(pending upload)" : draft.image}
                  onChange={(e) => {
                    if (pendingImageRef.current) {
                      pendingImageRef.current = null;
                      if (pendingPreview) { URL.revokeObjectURL(pendingPreview); setPendingPreview(null); }
                    }
                    update("image", e.target.value);
                  }}
                  onFocus={(e) => {
                    if (pendingImageRef.current) {
                      pendingImageRef.current = null;
                      if (pendingPreview) { URL.revokeObjectURL(pendingPreview); setPendingPreview(null); }
                      e.target.value = draft.image;
                    }
                  }}
                  placeholder="/project.png"
                  className="flex-1 min-w-0 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-2.5 py-1.5 text-xs text-foreground placeholder:text-[#555] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none motion-safe:transition-all"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#171717] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] text-xs font-medium hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] motion-safe:transition-all disabled:opacity-50 shrink-0"
                >
                  <ImagePlus size={12} />
                  {pendingPreview ? "✓ Selected" : "Select"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageSelect(f);
                    e.currentTarget.value = "";
                  }}
                />
              </div>
              {uploadError && <p className="text-red-400 text-[11px]">{uploadError}</p>}
              {(pendingPreview || draft.image) && (
                <div className="relative">
                  <img
                    src={pendingPreview ?? assetPath(draft.image)}
                    alt="preview"
                    className="h-28 w-full rounded-[8px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  {pendingPreview && (
                    <span className="absolute top-1.5 right-1.5 bg-amber-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                      PENDING UPLOAD
                    </span>
                  )}
                </div>
              )}
              {pendingPreview && pendingImageRef.current && (
                <div className="flex items-center gap-1.5">
                  <input
                    value={pendingName}
                    onChange={(e) =>
                      setPendingName(e.target.value.replace(/[^a-z0-9-_]/gi, "-").toLowerCase())
                    }
                    placeholder="file-name (no extension)"
                    className="flex-1 min-w-0 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.12)] rounded-[6px] px-2.5 py-1.5 text-xs text-foreground font-mono placeholder:text-[#444] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none motion-safe:transition-all"
                  />
                  <span className="text-[11px] text-[#555] shrink-0">
                    .{pendingImageRef.current.name.split(".").pop()}
                  </span>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Category</span>
              <input
                defaultValue={draft.category.join(", ")}
                key={draft.category.join(",")}
                onBlur={(e) =>
                  update("category", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
                placeholder="backend, frontend"
                className="w-full bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] rounded-[6px] px-2.5 py-1.5 text-xs text-foreground placeholder:text-[#555] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)] outline-none motion-safe:transition-all"
              />
            </div>

            {/* Links */}
            <div className="space-y-2 flex-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Links (JSON)</span>
              <textarea
                value={JSON.stringify(draft.links, null, 2)}
                onChange={(e) => {
                  try { update("links", JSON.parse(e.target.value)); setLinksError(""); }
                  catch { setLinksError("Invalid JSON"); }
                }}
                rows={7}
                className={`w-full bg-[#0a0a0a] rounded-[6px] px-2.5 py-2 text-[11px] text-foreground focus:outline-none resize-none font-mono motion-safe:transition-all ${
                  linksError
                    ? "shadow-[0_0_0_1px_rgba(248,113,113,0.5)]"
                    : "shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)]"
                }`}
              />
              {linksError && <p className="text-red-400 text-[10px]">{linksError}</p>}
            </div>
          </div>

          {/* RIGHT: Content panel */}
          <div className="flex-1 min-w-0 md:overflow-y-auto p-5 sm:p-6 space-y-5">

            {/* Title */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Title *</span>
              <input
                value={draft.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Project name"
                className={inputCls(!!errors.title).replace("text-sm", "text-base font-semibold")}
              />
              {errors.title && <p className="text-red-400 text-[11px]">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Description *</span>
              <textarea
                value={draft.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                placeholder="Short description shown on the portfolio card..."
                className={inputCls(!!errors.description) + " leading-relaxed"}
              />
              {errors.description && <p className="text-red-400 text-[11px]">{errors.description}</p>}
            </div>

            {/* Overview */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Overview</span>
              <textarea
                value={draft.overview ?? ""}
                onChange={(e) => update("overview", e.target.value)}
                rows={5}
                placeholder="Detailed overview shown in the project modal..."
                className={inputCls() + " leading-relaxed"}
              />
            </div>

            {/* Features */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Features <span className="normal-case font-normal text-[#555]">(one per line)</span>
              </span>
              <textarea
                value={(draft.features ?? []).join("\n")}
                onChange={(e) => update("features", e.target.value.split("\n").filter(Boolean))}
                rows={8}
                placeholder={"🔐 Authentication: JWT-based login\n📊 Dashboard: Real-time analytics\n..."}
                className={inputCls() + " font-mono leading-relaxed"}
              />
            </div>

            {/* Technologies */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Technologies <span className="normal-case font-normal text-[#555]">(JSON)</span>
              </span>
              <textarea
                value={JSON.stringify(draft.technologies ?? {}, null, 2)}
                onChange={(e) => {
                  try { update("technologies", JSON.parse(e.target.value)); setTechError(""); }
                  catch { setTechError("Invalid JSON"); }
                }}
                rows={6}
                className={`w-full bg-[#0a0a0a] rounded-[6px] px-3 py-2.5 text-[11px] text-foreground focus:outline-none resize-none font-mono leading-relaxed motion-safe:transition-all ${
                  techError
                    ? "shadow-[0_0_0_1px_rgba(248,113,113,0.5)]"
                    : "shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)]"
                }`}
              />
              {techError && <p className="text-red-400 text-[10px]">{techError}</p>}
            </div>

            {/* Technical Details */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Technical Details <span className="normal-case font-normal text-[#555]">(JSON)</span>
              </span>
              <textarea
                value={JSON.stringify(draft.technicalDetails ?? {}, null, 2)}
                onChange={(e) => {
                  try { update("technicalDetails", JSON.parse(e.target.value)); setTechDetailsError(""); }
                  catch { setTechDetailsError("Invalid JSON"); }
                }}
                rows={8}
                className={`w-full bg-[#0a0a0a] rounded-[6px] px-3 py-2.5 text-[11px] text-foreground focus:outline-none resize-none font-mono leading-relaxed motion-safe:transition-all ${
                  techDetailsError
                    ? "shadow-[0_0_0_1px_rgba(248,113,113,0.5)]"
                    : "shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.3)]"
                }`}
              />
              {techDetailsError && <p className="text-red-400 text-[10px]">{techDetailsError}</p>}
            </div>

            {generateError && (
              <div className="px-3 py-2 bg-red-500/8 shadow-[0_0_0_1px_rgba(248,113,113,0.2)] rounded-[6px] text-red-400 text-xs">
                {generateError}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-white/8 shrink-0">
          <p className="text-xs text-[#444] hidden sm:block">
            {item.id === 0 ? "New project" : `ID: ${item.id}`}
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-white/90 text-[#0a0a0a] font-bold text-sm rounded-[6px] motion-safe:transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={14} />
              {uploading ? "Uploading..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
