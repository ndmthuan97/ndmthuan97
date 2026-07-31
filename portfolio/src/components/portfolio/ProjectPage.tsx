import { useEffect } from "react";
import { ChevronRight, ExternalLink, Home } from "lucide-react";
import { assetPath } from "../../utils/asset-path";
import { categoryStyle, getTechGroups } from "../../lib/portfolio-helpers";
import { TechIcon } from "../tech-icon";
import { TopNav } from "../top-nav";
import { RichText } from "../rich-text";
import { ProjectTypeBadge } from "./ProjectTypeBadge";
import { RealUsersBadge } from "./RealUsersBadge";
import type { PortfolioItem } from "../../types/portfolio";

/**
 * One hue per section, carried by the panel ring, the heading and the bullet
 * markers — that is what separates the blocks now that the headings have no
 * icons. Tinted outlines only, no filled backgrounds: a solid panel among
 * outlined ones reads as "this one matters more", which is not the message.
 *
 * Every class is written out in full. Tailwind scans source as text, so a
 * composed string like `ring-${hue}-500/25` generates nothing.
 */
const ACCENTS = {
  // Overview is framed like the rest but left un-hued: it is the lead paragraph,
  // not one more category, and giving it a seventh colour next to blue and cyan
  // would just add a shade nobody can tell apart.
  plain:   { panel: "rounded-xl p-5 ring-line",                    title: "text-foreground",  dot: "bg-foreground/40" },
  emerald: { panel: "rounded-xl p-5 ring-1 ring-emerald-500/25",   title: "text-emerald-500", dot: "bg-emerald-500/70" },
  violet:  { panel: "rounded-xl p-5 ring-1 ring-violet-500/25",    title: "text-violet-500",  dot: "bg-violet-500/70" },
  amber:   { panel: "rounded-xl p-5 ring-1 ring-amber-500/25",     title: "text-amber-500",   dot: "bg-amber-500/70" },
  blue:    { panel: "rounded-xl p-5 ring-1 ring-blue-500/25",      title: "text-blue-500",    dot: "bg-blue-500/70" },
  cyan:    { panel: "rounded-xl p-5 ring-1 ring-cyan-500/25",      title: "text-cyan-500",    dot: "bg-cyan-500/70" },
  rose:    { panel: "rounded-xl p-5 ring-1 ring-rose-500/25",      title: "text-rose-500",    dot: "bg-rose-500/70" },
  // Tech Stack stays neutral — the logos inside are already every colour there
  // is, and a tinted frame around them just fights for attention.
  neutral: { panel: "rounded-xl p-5 ring-line",                    title: "text-muted-foreground", dot: "bg-muted-foreground/40" },
} as const;

type Accent = keyof typeof ACCENTS;

function Section({
  title, span, accent = "plain", children,
}: {
  title: string;
  span: string;
  accent?: Accent;
  children: React.ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <section className={`${span} ${a.panel} space-y-3`}>
      <h2 className={`font-mono text-xs font-medium uppercase tracking-wider ${a.title}`}>{title}</h2>
      {children}
    </section>
  );
}

/**
 * The single bullet style. Responsibilities, features, highlights and impact are
 * all just lists of points, so they get one marker rather than a check, a dot, a
 * number and an arrow — four markers made four lists look like four ideas.
 *
 * `columns` flows a long list into newspaper columns instead of one tall stack.
 * Multi-column rather than a grid because the items differ in length: a grid
 * makes every row as tall as its longest cell, columns just balance.
 */
function Bullets({ items, columns, dot }: { items: string[]; columns?: string; dot: string }) {
  return (
    <ul className={columns ? `${columns} gap-x-8` : "space-y-2.5"}>
      {items.map((text, i) => (
        <li
          key={i}
          className={`flex gap-2.5 items-start text-sm text-muted-foreground leading-relaxed ${columns ? "mb-2.5 break-inside-avoid" : ""}`}
        >
          <span className={`mt-[7px] h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
          <span className="whitespace-pre-line"><RichText>{text}</RichText></span>
        </li>
      ))}
    </ul>
  );
}

/** `full` drops the measure cap for the Overview, which is meant to read as a
 *  banner across the top of the page rather than a column in the corner. The
 *  cap stays on the narrower sections, where a 5-column track is already about
 *  the right line length. */
function Prose({ children, full }: { children: string; full?: boolean }) {
  return (
    <p className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap ${full ? "" : "max-w-prose"}`}>
      <RichText>{children}</RichText>
    </p>
  );
}

// No onBack prop: the breadcrumb's "Projects" link already goes there, and a
// second control doing the same thing is just another thing to keep in sync.
export function ProjectPage({ item }: { item: PortfolioItem }) {
  const techGroups = getTechGroups(item);

  // Arriving from a card leaves the window scrolled to wherever that card was.
  useEffect(() => { window.scrollTo(0, 0); }, [item.id]);

  const extraLinks = item.links ?? [];

  return (
    <div className="min-h-screen w-full relative bg-background overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid" />

      {/* The same header as the main page. There are no sections to observe here,
          so a nav click just sets the hash and lets App swap back to the
          portfolio view, which scrolls to whichever section the hash names.
          Experience stays lit because a project page belongs under it. */}
      <TopNav activeSection="portfolio" onNavigate={(section) => { window.location.hash = section; }} />

      {/* pt clears the fixed header on desktop; on mobile the header is hidden
          (a floating button takes its place) so the small padding is enough. */}
      <div className="relative z-10 container mx-auto max-w-7xl px-6 md:px-10 lg:px-16 pt-8 md:pt-28 pb-8 md:pb-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <li>
              <a href="#" className="inline-flex items-center gap-1.5 hover:text-brand! motion-safe:transition-colors">
                <Home size={12} />
                Home
              </a>
            </li>
            <li aria-hidden="true"><ChevronRight size={12} /></li>
            <li>
              <a href="#portfolio" className="hover:text-brand! motion-safe:transition-colors">Projects</a>
            </li>
            <li aria-hidden="true"><ChevronRight size={12} /></li>
            {/* aria-current marks the trail's end; it is text, not a link. */}
            <li aria-current="page" className="text-foreground font-medium truncate max-w-[16rem]">
              {item.title}
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="flex flex-col sm:flex-row gap-5 items-start mb-8 pb-8 border-b border-border">
          <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl ring-line bg-secondary">
            <img
              src={assetPath(item.image || "/default.png")}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = assetPath("/default.png"); }}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2.5">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
              {item.title}
            </h1>

            <div className="flex flex-wrap items-center gap-1.5">
              {item.category.map((cat) => (
                <span
                  key={cat}
                  className={`font-mono text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${categoryStyle(cat).muted}`}
                >
                  {cat}
                </span>
              ))}
              <ProjectTypeBadge type={item.projectType} size={12} />
            </div>

            {(item.role || item.year || item.hasRealUsers) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
                {item.role && <span><span className="font-semibold text-foreground/70">Role:</span> {item.role}</span>}
                {item.year && <span><span className="font-semibold text-foreground/70">Year:</span> {item.year}</span>}
                <RealUsersBadge active={item.hasRealUsers} size={12} />
              </div>
            )}

            {(item.demoUrl || extraLinks.length > 0) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {item.demoUrl && (
                  <a
                    href={item.demoUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-foreground text-background! px-3 py-1.5 rounded-md hover:opacity-90 motion-safe:transition-all"
                  >
                    Live demo <ExternalLink size={12} />
                  </a>
                )}
                {extraLinks.map((link, idx) => (
                  <a
                    key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-secondary text-foreground ring-line hover:ring-strong px-3 py-1.5 rounded-md motion-safe:transition-all"
                  >
                    {link.label} <ExternalLink size={12} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Body — 12-column grid. Spans follow the shape of each section's
            content rather than a fixed rhythm: long lists take the full width and
            split into columns internally, since a ten-item list squeezed into a
            half-width track just becomes a tall thin box.
            Impact and Business Context stack in the left column while My Role
            spans both rows beside them — DOM order is Impact, My Role, Business
            so grid auto-placement lands Business under Impact rather than
            starting a new row. */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 content-start">
          <Section title="Overview" span="md:col-span-12">
            <Prose full>{item.overview || item.description}</Prose>
          </Section>

          {item.impact?.length ? (
            <Section title="Impact / Results" span="md:col-span-5" accent="emerald">
              <Bullets items={item.impact} dot={ACCENTS.emerald.dot} />
            </Section>
          ) : null}

          {(item.roleSummary || item.responsibilities?.length) && (
            <Section title="My Role" span="md:col-span-7 md:row-span-2" accent="violet">
              {item.roleSummary && (
                <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">
                  <RichText>{item.roleSummary}</RichText>
                </p>
              )}
              {item.responsibilities?.length ? <Bullets items={item.responsibilities} dot={ACCENTS.violet.dot} /> : null}
            </Section>
          )}

          {item.businessContext && (
            <Section title="Business Context" span="md:col-span-5" accent="amber">
              <Prose>{item.businessContext}</Prose>
            </Section>
          )}

          {item.features?.length ? (
            <Section title="Key Features" span="md:col-span-12" accent="blue">
              <Bullets items={item.features} columns="md:columns-2 xl:columns-3" dot={ACCENTS.blue.dot} />
            </Section>
          ) : null}

          {item.highlights?.length ? (
            <Section title="Technical Highlights" span="md:col-span-12" accent="cyan">
              <Bullets items={item.highlights} columns="lg:columns-2" dot={ACCENTS.cyan.dot} />
            </Section>
          ) : null}

          {item.challenges?.length ? (
            <Section title="Challenges & Solutions" span="md:col-span-12" accent="rose">
              <div className="space-y-4">
                {item.challenges.map((c, i) => (
                  <article key={i} className="rounded-xl ring-line p-4 space-y-2.5">
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{c.title}</h3>
                    {/* Label above the text, not beside it: this card can sit in a
                        half-width column, and media queries measure the viewport
                        rather than the column, so a side label would still fire
                        at desktop width and crush the paragraph. */}
                    {([["Problem", c.problem], ["Solution", c.solution], ["Result", c.result]] as const)
                      .filter(([, text]) => text)
                      .map(([label, text]) => (
                        <div key={label}>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-rose-500">{label}</span>
                          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                            <RichText>{text as string}</RichText>
                          </p>
                        </div>
                      ))}
                  </article>
                ))}
              </div>
            </Section>
          ) : null}

          {techGroups.length > 0 && (
            <Section title="Tech Stack" span="md:col-span-12" accent="neutral">
              <div className="flex flex-col gap-4">
                {techGroups.map((group) => (
                  <div key={group.key} className="grid sm:grid-cols-[7rem_1fr] gap-x-4 gap-y-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground pt-2">
                      {group.label}
                    </span>
                    <div className="flex flex-wrap gap-x-5 gap-y-2.5">
                      {group.techs.map((t) => (
                        <div key={t.name} className="inline-flex items-center gap-2">
                          {/* Name is visible next to the icon — keep the logo out of the a11y tree. */}
                          <TechIcon name={t.name} srcs={t.srcs} size={24} decorative />
                          <span className="text-xs font-medium text-foreground">{t.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
