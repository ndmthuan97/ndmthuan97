import { useState } from "react";
import { Save, Plus, Trash2, Sparkles } from "lucide-react";
import homeData from "../../data/home.json";
import aboutData from "../../data/about.json";
import skillsData from "../../data/skills.json";
import contactData from "../../data/contact.json";
import educationData from "../../data/education.json";
import { commitToGitHub } from "../../hooks/use-github";
import { generateAbout, hasAI } from "../../hooks/use-ai-generation";
import type { ToastMsg } from "./toast";

/** Comma-joined skill display names, used as AI context for the About section. */
function skillsContext(): string {
  return (skillsData.skillCategories as { skills: { icon: string }[] }[])
    .flatMap((c) => c.skills.map((s) => s.icon))
    .join(", ");
}

type Toast = (type: ToastMsg["type"], text: string, detail?: string) => void;

const inputCls =
  "w-full bg-secondary ring-line rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-strong outline-none motion-safe:transition-all";

// ─── Shared field components ────────────────────────────────────────────────
function Field({
  id, label, value, onChange, placeholder, textarea, rows,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; textarea?: boolean; rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="mono-label text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea id={id} value={value} rows={rows ?? 4} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} className={`${inputCls} resize-none leading-relaxed`} />
      ) : (
        <input id={id} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} className={inputCls} />
      )}
    </div>
  );
}

function RowCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="relative rounded-lg ring-line bg-background p-4 pr-10 space-y-3">
      <button
        type="button" onClick={onRemove} title="Remove"
        className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 motion-safe:transition-colors cursor-pointer"
      >
        <Trash2 size={14} />
      </button>
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md bg-secondary ring-line hover:ring-strong motion-safe:transition-all cursor-pointer">
      <Plus size={14} /> {label}
    </button>
  );
}

function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end pt-2 sticky bottom-0 bg-card/80 backdrop-blur-sm -mx-1 px-1 py-2">
      <button onClick={onSave} disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground hover:opacity-90 text-background font-medium text-sm rounded-md motion-safe:transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer">
        <Save size={15} /> {saving ? "Saving…" : "Save & Commit"}
      </button>
    </div>
  );
}

/** Commits one data file and toasts the result. */
function useSectionSave(file: string, toast: Toast) {
  const [saving, setSaving] = useState(false);
  const save = async (data: unknown) => {
    setSaving(true);
    const res = await commitToGitHub(JSON.stringify(data, null, 4), file);
    setSaving(false);
    if (res.ok) toast("success", "✓ Saved — the site will redeploy shortly");
    else toast("error", "⚠ Save failed", res.message);
  };
  return { saving, save };
}

// ─── Home ───────────────────────────────────────────────────────────────────
function HomeForm({ toast }: { toast: Toast }) {
  const { saving, save } = useSectionSave("home", toast);
  const h = homeData as { name: string; role: string; bio: string; highlights?: string[]; goal?: string; profileImage: string };
  const [name, setName] = useState(h.name);
  const [role, setRole] = useState(h.role);
  const [bio, setBio] = useState(h.bio);
  const [highlights, setHighlights] = useState((h.highlights ?? []).join("\n"));
  const [goal, setGoal] = useState(h.goal ?? "");
  const [profileImage, setProfileImage] = useState(h.profileImage);
  return (
    <div className="space-y-4">
      <Field id="home-name" label="Name" value={name} onChange={setName} placeholder="MINH THUAN" />
      <Field id="home-role" label="Role" value={role} onChange={setRole} placeholder="Software Engineer" />
      <Field id="home-bio" label="Bio — personal intro (who you are)" textarea rows={4} value={bio} onChange={setBio} />
      <Field id="home-highlights" label="Highlights (one per line)" textarea rows={3} value={highlights} onChange={setHighlights} />
      <Field id="home-goal" label="Goal — career objective" textarea rows={3} value={goal} onChange={setGoal} />
      <Field id="home-img" label="Profile image path" value={profileImage} onChange={setProfileImage} placeholder="/profile.JPG" />
      <SaveBar
        onSave={() => save({
          name,
          role,
          bio,
          highlights: highlights.split("\n").map((s) => s.trim()).filter(Boolean),
          goal,
          profileImage,
        })}
        saving={saving}
      />
    </div>
  );
}

// ─── About ──────────────────────────────────────────────────────────────────
type Stat = { value: string; suffix?: string; label: string };
type Info = { label: string; value: string; highlight?: boolean };

function AboutForm({ toast }: { toast: Toast }) {
  const { saving, save } = useSectionSave("about", toast);
  const [summary, setSummary] = useState<string>((aboutData as { summary?: string }).summary ?? "");
  const [highlights, setHighlights] = useState<string>(((aboutData as { highlights?: string[] }).highlights ?? []).join("\n"));
  const [stats, setStats] = useState<Stat[]>(aboutData.stats as Stat[]);
  const [info, setInfo] = useState<Info[]>(aboutData.personalInfo as Info[]);
  const [aiHint, setAiHint] = useState("");
  const [generating, setGenerating] = useState(false);

  const upStat = (i: number, k: keyof Stat, v: string) =>
    setStats((p) => p.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
  const upInfo = (i: number, k: keyof Info, v: string | boolean) =>
    setInfo((p) => p.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateAbout({
        hint: aiHint,
        role: (homeData as { role?: string }).role ?? "Software Engineer",
        skills: skillsContext(),
        current: summary,
      });
      setSummary(res.summary ?? summary);
      if (Array.isArray(res.highlights) && res.highlights.length) {
        setHighlights(res.highlights.join("\n"));
      }
      toast("success", `✨ Drafted via ${res._provider}`);
    } catch (e) {
      toast("error", "⚠ AI assist failed", e instanceof Error ? e.message : "Unknown error");
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* AI assist */}
      {hasAI() && (
        <div className="rounded-lg ring-line bg-background p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-brand" />
            <span className="mono-label text-muted-foreground">AI assist</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Optionally add a hint (e.g. <em>"emphasize backend &amp; AI, open to remote work"</em>), then let AI draft your summary + highlights. You can edit the result before saving.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={aiHint}
              onChange={(e) => setAiHint(e.target.value)}
              placeholder="What to emphasize (optional)"
              className={inputCls}
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 brand-soft ring-line hover:ring-strong rounded-md text-sm font-medium motion-safe:transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Sparkles size={14} className={generating ? "animate-spin" : ""} />
              {generating ? "Drafting…" : "Draft with AI"}
            </button>
          </div>
        </div>
      )}

      <Field id="about-summary" label="Summary" textarea rows={4} value={summary} onChange={setSummary} />
      <Field
        id="about-highlights"
        label="Highlights (one per line)"
        textarea
        rows={4}
        value={highlights}
        onChange={setHighlights}
      />

      <div className="space-y-3">
        <p className="mono-label text-muted-foreground">Stats</p>
        {stats.map((s, i) => (
          <RowCard key={i} onRemove={() => setStats((p) => p.filter((_, x) => x !== i))}>
            <div className="grid grid-cols-3 gap-3">
              <Field id={`stat-v-${i}`} label="Value" value={s.value} onChange={(v) => upStat(i, "value", v)} placeholder="3" />
              <Field id={`stat-s-${i}`} label="Suffix" value={s.suffix ?? ""} onChange={(v) => upStat(i, "suffix", v)} placeholder="+" />
              <Field id={`stat-l-${i}`} label="Label" value={s.label} onChange={(v) => upStat(i, "label", v)} placeholder="YEARS" />
            </div>
          </RowCard>
        ))}
        <AddButton label="Add stat" onClick={() => setStats((p) => [...p, { value: "", suffix: "", label: "" }])} />
      </div>

      <div className="space-y-3">
        <p className="mono-label text-muted-foreground">Personal Information</p>
        {info.map((s, i) => (
          <RowCard key={i} onRemove={() => setInfo((p) => p.filter((_, x) => x !== i))}>
            <div className="grid grid-cols-2 gap-3">
              <Field id={`info-l-${i}`} label="Label" value={s.label} onChange={(v) => upInfo(i, "label", v)} placeholder="Email:" />
              <Field id={`info-v-${i}`} label="Value" value={s.value} onChange={(v) => upInfo(i, "value", v)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={!!s.highlight} onChange={(e) => upInfo(i, "highlight", e.target.checked)} />
              Highlight (accent color)
            </label>
          </RowCard>
        ))}
        <AddButton label="Add info row" onClick={() => setInfo((p) => [...p, { label: "", value: "" }])} />
      </div>

      <SaveBar
        onSave={() => save({
          summary,
          highlights: highlights.split("\n").map((s) => s.trim()).filter(Boolean),
          stats,
          personalInfo: info,
        })}
        saving={saving}
      />
    </div>
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────────
type Cat = { title: string; icons: string };

function SkillsForm({ toast }: { toast: Toast }) {
  const { saving, save } = useSectionSave("skills", toast);
  const [cats, setCats] = useState<Cat[]>(
    (skillsData.skillCategories as { title: string; skills: { icon: string }[] }[]).map((c) => ({
      title: c.title,
      icons: c.skills.map((s) => s.icon).join(", "),
    }))
  );
  const up = (i: number, k: keyof Cat, v: string) =>
    setCats((p) => p.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)));

  const onSave = () =>
    save({
      skillCategories: cats.map((c) => ({
        title: c.title,
        skills: c.icons.split(",").map((s) => s.trim()).filter(Boolean).map((icon) => ({ icon })),
      })),
    });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Icons use <a href="https://simpleicons.org" target="_blank" rel="noopener noreferrer" className="text-brand underline">Simple Icons</a> slugs (e.g. <code className="font-mono">dotnet, react, postgres</code>), comma-separated. Missing logos fall back to the brand favicon, then a text chip.
      </p>
      {cats.map((c, i) => (
        <RowCard key={i} onRemove={() => setCats((p) => p.filter((_, x) => x !== i))}>
          <Field id={`cat-t-${i}`} label="Category title" value={c.title} onChange={(v) => up(i, "title", v)} placeholder="Backend" />
          <Field id={`cat-i-${i}`} label="Icon slugs" textarea rows={2} value={c.icons} onChange={(v) => up(i, "icons", v)} placeholder="dotnet, cs, postgres" />
        </RowCard>
      ))}
      <AddButton label="Add category" onClick={() => setCats((p) => [...p, { title: "", icons: "" }])} />
      <SaveBar onSave={onSave} saving={saving} />
    </div>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
type Contact = { id: string; icon: string; label: string; value: string; href: string | null };

function ContactForm({ toast }: { toast: Toast }) {
  const { saving, save } = useSectionSave("contact", toast);
  const [contacts, setContacts] = useState<Contact[]>(contactData.contacts as Contact[]);
  const up = (i: number, k: keyof Contact, v: string) =>
    setContacts((p) => p.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="mono-label text-muted-foreground">Contacts</p>
        {contacts.map((c, i) => (
          <RowCard key={i} onRemove={() => setContacts((p) => p.filter((_, x) => x !== i))}>
            <div className="grid grid-cols-2 gap-3">
              <Field id={`c-icon-${i}`} label="Icon (Mail/Phone/Github/Linkedin/MapPin)" value={c.icon} onChange={(v) => up(i, "icon", v)} />
              <Field id={`c-label-${i}`} label="Label" value={c.label} onChange={(v) => up(i, "label", v)} />
            </div>
            <Field id={`c-value-${i}`} label="Value" value={c.value} onChange={(v) => up(i, "value", v)} />
            <Field id={`c-href-${i}`} label="Href (link, leave blank if none)" value={c.href ?? ""} onChange={(v) => up(i, "href", v)} placeholder="https://… or mailto:…" />
          </RowCard>
        ))}
        <AddButton label="Add contact" onClick={() => setContacts((p) => [...p, { id: `c${Date.now()}`, icon: "Mail", label: "", value: "", href: "" }])} />
      </div>

      <SaveBar
        onSave={() => save({ contacts: contacts.map((c) => ({ ...c, href: c.href || null })) })}
        saving={saving}
      />
    </div>
  );
}

// ─── Education ──────────────────────────────────────────────────────────────────
type Edu = {
  school: string; degree: string; period: string; location: string;
  url: string; logo: string; description: string;
  coursework: string; achievements: string; highlights: string;
};
type Cert = { name: string; issuer: string; year: string; credentialUrl: string; image: string };

function EducationForm({ toast }: { toast: Toast }) {
  const { saving, save } = useSectionSave("education", toast);
  const data = educationData as {
    items: { school: string; degree: string; period: string; location: string; url?: string; logo?: string; description: string; coursework?: string[]; achievements?: string[]; highlights: string[] }[];
    certifications?: Partial<Cert>[];
  };
  const [items, setItems] = useState<Edu[]>(
    data.items.map((e) => ({
      school: e.school, degree: e.degree, period: e.period, location: e.location,
      url: e.url ?? "", logo: e.logo ?? "", description: e.description,
      coursework: (e.coursework ?? []).join(", "),
      achievements: (e.achievements ?? []).join("\n"),
      highlights: e.highlights.join(", "),
    }))
  );
  const [certs, setCerts] = useState<Cert[]>(
    (data.certifications ?? []).map((c) => ({
      name: c.name ?? "", issuer: c.issuer ?? "", year: c.year ?? "",
      credentialUrl: c.credentialUrl ?? "", image: c.image ?? "",
    }))
  );

  const up = (i: number, k: keyof Edu, v: string) =>
    setItems((p) => p.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));
  const upCert = (i: number, k: keyof Cert, v: string) =>
    setCerts((p) => p.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)));

  const onSave = () =>
    save({
      items: items.map((e) => ({
        school: e.school, degree: e.degree, period: e.period, location: e.location,
        url: e.url, logo: e.logo, description: e.description,
        highlights: e.highlights.split(",").map((s) => s.trim()).filter(Boolean),
        coursework: e.coursework.split(",").map((s) => s.trim()).filter(Boolean),
        achievements: e.achievements.split("\n").map((s) => s.trim()).filter(Boolean),
      })),
      certifications: certs,
    });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="mono-label text-muted-foreground">Education</p>
        {items.map((e, i) => (
          <RowCard key={i} onRemove={() => setItems((p) => p.filter((_, x) => x !== i))}>
            <div className="grid grid-cols-2 gap-3">
              <Field id={`e-school-${i}`} label="School" value={e.school} onChange={(v) => up(i, "school", v)} />
              <Field id={`e-period-${i}`} label="Period" value={e.period} onChange={(v) => up(i, "period", v)} placeholder="2021 — 2025" />
            </div>
            <Field id={`e-degree-${i}`} label="Degree" value={e.degree} onChange={(v) => up(i, "degree", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field id={`e-loc-${i}`} label="Location" value={e.location} onChange={(v) => up(i, "location", v)} />
              <Field id={`e-url-${i}`} label="School URL (optional)" value={e.url} onChange={(v) => up(i, "url", v)} placeholder="https://…" />
            </div>
            <Field id={`e-logo-${i}`} label="Logo / image path" value={e.logo} onChange={(v) => up(i, "logo", v)} placeholder="/education.jpg" />
            <Field id={`e-desc-${i}`} label="Description" textarea rows={3} value={e.description} onChange={(v) => up(i, "description", v)} />
            <Field id={`e-cw-${i}`} label="Relevant coursework (comma-separated)" value={e.coursework} onChange={(v) => up(i, "coursework", v)} placeholder="Data Structures, Database Systems" />
            <Field id={`e-ach-${i}`} label="Achievements (one per line)" textarea rows={3} value={e.achievements} onChange={(v) => up(i, "achievements", v)} placeholder="Scholarship 2022&#10;Top 5 capstone project" />
            <Field id={`e-hl-${i}`} label="Highlights (comma-separated)" value={e.highlights} onChange={(v) => up(i, "highlights", v)} placeholder="GPA: 3.2/4.0, Backend track" />
          </RowCard>
        ))}
        <AddButton label="Add education" onClick={() => setItems((p) => [...p, { school: "", degree: "", period: "", location: "", url: "", logo: "", description: "", coursework: "", achievements: "", highlights: "" }])} />
      </div>

      <div className="space-y-4">
        <p className="mono-label text-muted-foreground">Certifications</p>
        {certs.map((c, i) => (
          <RowCard key={i} onRemove={() => setCerts((p) => p.filter((_, x) => x !== i))}>
            <Field id={`cert-name-${i}`} label="Name" value={c.name} onChange={(v) => upCert(i, "name", v)} placeholder="AWS Certified Cloud Practitioner" />
            <div className="grid grid-cols-2 gap-3">
              <Field id={`cert-iss-${i}`} label="Issuer" value={c.issuer} onChange={(v) => upCert(i, "issuer", v)} placeholder="Amazon Web Services" />
              <Field id={`cert-year-${i}`} label="Year" value={c.year} onChange={(v) => upCert(i, "year", v)} placeholder="2024" />
            </div>
            <Field id={`cert-url-${i}`} label="Credential URL (optional)" value={c.credentialUrl} onChange={(v) => upCert(i, "credentialUrl", v)} placeholder="https://…" />
            <Field id={`cert-img-${i}`} label="Proof image path (optional)" value={c.image} onChange={(v) => upCert(i, "image", v)} placeholder="/certs/pmp.jpg" />
          </RowCard>
        ))}
        <AddButton label="Add certification" onClick={() => setCerts((p) => [...p, { name: "", issuer: "", year: "", credentialUrl: "", image: "" }])} />
      </div>

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  );
}

// ─── Section renderer ─────────────────────────────────────────────────────────
export type ContentSection = "home" | "about" | "skills" | "education" | "contact";

export function ContentSettings({ section, toast }: { section: ContentSection; toast: Toast }) {
  return (
    <div className="space-y-4">
      <div className="surface p-5 md:p-6">
        {section === "home" && <HomeForm toast={toast} />}
        {section === "about" && <AboutForm toast={toast} />}
        {section === "skills" && <SkillsForm toast={toast} />}
        {section === "education" && <EducationForm toast={toast} />}
        {section === "contact" && <ContactForm toast={toast} />}
      </div>
      <p className="text-xs text-muted-foreground">
        Each section saves to its own data file and commits to GitHub. Changes go live after Vercel redeploys (~1 min).
      </p>
    </div>
  );
}
