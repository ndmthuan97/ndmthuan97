import { useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import aboutData from "../../data/about.json";
import skillsData from "../../data/skills.json";
import iconsData from "../../data/icons.json";
import contactData from "../../data/contact.json";
import educationData from "../../data/education.json";
import { commitToGitHub } from "../../hooks/use-github";
import type { ToastMsg } from "./toast";

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

// ─── About ──────────────────────────────────────────────────────────────────
type Info = { label: string; value: string; highlight?: boolean };

function AboutForm({ toast }: { toast: Toast }) {
  const { saving, save } = useSectionSave("about", toast);
  const h = aboutData as {
    name: string; role: string; bio: string; highlights?: string[]; goal?: string;
    personalInfo?: Info[]; profileImage: string;
  };
  const [name, setName] = useState(h.name);
  const [role, setRole] = useState(h.role);
  const [bio, setBio] = useState(h.bio);
  const [highlights, setHighlights] = useState((h.highlights ?? []).join("\n"));
  const [goal, setGoal] = useState(h.goal ?? "");
  const [info, setInfo] = useState<Info[]>(h.personalInfo ?? []);
  const [profileImage, setProfileImage] = useState(h.profileImage);

  const upInfo = (i: number, k: keyof Info, v: string | boolean) =>
    setInfo((p) => p.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));

  return (
    <div className="space-y-4">
      <Field id="about-name" label="Name" value={name} onChange={setName} placeholder="MINH THUAN" />
      <Field id="about-role" label="Role" value={role} onChange={setRole} placeholder="Software Engineer" />
      <Field id="about-bio" label="Bio — personal intro (who you are)" textarea rows={4} value={bio} onChange={setBio} />
      <Field id="about-highlights" label="Highlights / key strengths (one per line)" textarea rows={5} value={highlights} onChange={setHighlights} />
      <Field id="about-goal" label="Goal — career objective" textarea rows={3} value={goal} onChange={setGoal} />

      <div className="space-y-3">
        <p className="mono-label text-muted-foreground">Personal Information</p>
        {info.map((s, i) => (
          <RowCard key={i} onRemove={() => setInfo((p) => p.filter((_, x) => x !== i))}>
            <div className="grid grid-cols-2 gap-3">
              <Field id={`info-l-${i}`} label="Label" value={s.label} onChange={(v) => upInfo(i, "label", v)} placeholder="Location" />
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

      <Field id="about-img" label="Profile image path" value={profileImage} onChange={setProfileImage} placeholder="/profile.JPG" />
      <SaveBar
        onSave={() => save({
          name,
          role,
          bio,
          highlights: highlights.split("\n").map((s) => s.trim()).filter(Boolean),
          goal,
          personalInfo: info,
          profileImage,
        })}
        saving={saving}
      />
    </div>
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────────
type SkillEntry = { icon: string; name?: string };
type CatDraft = { title: string; skills: SkillEntry[] };

function iconPreviewUrl(slug: string, iconsMap: Record<string, string>): string | null {
  const value = iconsMap[slug];
  if (!value) return null;
  if (value.startsWith("http")) return value;
  return `https://www.google.com/s2/favicons?domain=${value}&sz=128`;
}

function SkillsForm({ toast }: { toast: Toast }) {
  const { saving: savingSkills, save: saveSkills } = useSectionSave("skills", toast);
  const { saving: savingIcons, save: saveIcons } = useSectionSave("icons", toast);
  const saving = savingSkills || savingIcons;

  const [cats, setCats] = useState<CatDraft[]>(
    (skillsData.skillCategories as { title: string; skills: SkillEntry[] }[]).map((c) => ({
      title: c.title,
      skills: c.skills.map((s) => ({ icon: s.icon, name: s.name })),
    }))
  );
  const [iconsMap, setIconsMap] = useState<Record<string, string>>({ ...iconsData });

  const updateCatTitle = (ci: number, title: string) =>
    setCats((p) => p.map((c, i) => (i === ci ? { ...c, title } : c)));
  const updateSkill = (ci: number, si: number, field: keyof SkillEntry, value: string) =>
    setCats((p) => p.map((c, i) =>
      i === ci ? { ...c, skills: c.skills.map((s, j) => j === si ? { ...s, [field]: value || undefined } : s) } : c
    ));
  const addSkill = (ci: number) =>
    setCats((p) => p.map((c, i) => i === ci ? { ...c, skills: [...c.skills, { icon: "" }] } : c));
  const removeSkill = (ci: number, si: number) =>
    setCats((p) => p.map((c, i) => i === ci ? { ...c, skills: c.skills.filter((_, j) => j !== si) } : c));

  const onSave = async () => {
    const skillsPayload = {
      skillCategories: cats.map((c) => ({
        title: c.title,
        skills: c.skills.filter((s) => s.icon.trim()).map((s) => {
          const entry: SkillEntry = { icon: s.icon.trim() };
          if (s.name?.trim()) entry.name = s.name.trim();
          return entry;
        }),
      })),
    };
    await Promise.all([saveSkills(skillsPayload), saveIcons(iconsMap)]);
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Each skill needs a <strong>slug</strong> (e.g. <code className="font-mono">react</code>) and an <strong>icon source</strong> — either a website domain (Google Favicon) or a direct image URL.
      </p>

      {cats.map((cat, ci) => (
        <RowCard key={ci} onRemove={() => setCats((p) => p.filter((_, i) => i !== ci))}>
          <Field id={`cat-t-${ci}`} label="Category title" value={cat.title}
            onChange={(v) => updateCatTitle(ci, v)} placeholder="Backend & Database" />

          <div className="space-y-2 mt-3">
            <p className="mono-label text-muted-foreground">Skills</p>
            {cat.skills.map((skill, si) => {
              const preview = skill.icon.trim() ? iconPreviewUrl(skill.icon.trim(), iconsMap) : null;
              const hasSource = !!iconsMap[skill.icon.trim()];
              return (
                <div key={si} className="flex items-start gap-2 rounded-md bg-secondary/50 p-2.5">
                  {/* Icon preview */}
                  <div className="w-8 h-8 rounded flex items-center justify-center bg-background ring-line shrink-0 mt-0.5">
                    {preview ? (
                      <img src={preview} alt={skill.icon} className="w-5 h-5 object-contain" />
                    ) : (
                      <span className="text-[9px] text-muted-foreground font-mono">?</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={skill.icon}
                        onChange={(e) => updateSkill(ci, si, "icon", e.target.value)}
                        placeholder="slug (e.g. react)"
                        className={`${inputCls} text-xs`}
                      />
                      <input
                        value={skill.name ?? ""}
                        onChange={(e) => updateSkill(ci, si, "name", e.target.value)}
                        placeholder="Display name (optional)"
                        className={`${inputCls} text-xs`}
                      />
                    </div>
                    {/* Icon source — always editable */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {hasSource ? "📍" : "⚠️"}
                      </span>
                      <input
                        value={iconsMap[skill.icon.trim()] ?? ""}
                        onChange={(e) => {
                          const slug = skill.icon.trim();
                          if (!slug) return;
                          setIconsMap((m) => ({ ...m, [slug]: e.target.value }));
                        }}
                        placeholder={skill.icon.trim() ? "domain or https://... URL" : "enter slug first"}
                        disabled={!skill.icon.trim()}
                        className={`${inputCls} text-[11px] ${!hasSource && skill.icon.trim() ? "ring-amber-500/50" : ""}`}
                      />
                    </div>
                  </div>

                  <button type="button" onClick={() => removeSkill(ci, si)} title="Remove skill"
                    className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 motion-safe:transition-colors cursor-pointer shrink-0 mt-0.5">
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
            <AddButton label="Add skill" onClick={() => addSkill(ci)} />
          </div>
        </RowCard>
      ))}

      <AddButton label="Add category" onClick={() => setCats((p) => [...p, { title: "", skills: [] }])} />
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
export type ContentSection = "about" | "skills" | "education" | "contact";

export function ContentSettings({ section, toast }: { section: ContentSection; toast: Toast }) {
  return (
    <div className="space-y-4">
      <div className="surface p-5 md:p-6">
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
