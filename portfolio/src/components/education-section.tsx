import { useEffect, useState } from "react";
import { Award, ExternalLink, ImageIcon, X, ZoomIn } from "lucide-react";
import educationData from "../data/education.json";
import { useReveal } from "../hooks/use-reveal";
import { assetPath } from "../utils/asset-path";

interface EducationItem {
  school: string;
  degree: string;
  period: string;
  location: string;
  description: string;
  highlights: string[];
  logo?: string;
  coursework?: string[];
  achievements?: string[];
}

interface Certification {
  name: string;
  issuer: string;
  year: string;
  credentialUrl?: string;
  image?: string; // proof image (e.g. "/certs/pmp.jpg")
}

export function EducationSection() {
  const items = educationData.items as EducationItem[];
  const certifications = (educationData.certifications ?? []) as Certification[];
  const { isVisible, ref } = useReveal(0.05);
  // Lightbox: the certificate whose proof image is being viewed full-size.
  const [lightbox, setLightbox] = useState<Certification | null>(null);

  // Close the lightbox on Escape and lock background scroll while it's open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  return (
    <section id="education" ref={ref} className="py-24 md:py-32 px-6 md:px-10 lg:px-20 relative">
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className={`relative mb-14 text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span aria-hidden="true" className="section-watermark absolute -top-10 left-1/2 -translate-x-1/2 text-7xl md:text-8xl">
            STUDY
          </span>
          <h2 className="font-display font-bold tracking-tight text-3xl md:text-4xl text-foreground">
            Education
          </h2>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {items.map((edu, idx) => (
            <div
              key={idx}
              className={`${isVisible ? "animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-backwards" : "opacity-0"}`}
              style={{ animationDelay: isVisible ? `${idx * 150}ms` : "0ms" }}
            >
              <div className="group surface surface-hover overflow-hidden flex flex-col sm:flex-row">
                {/* Image (left) */}
                <div className="relative sm:w-80 md:w-[28rem] h-48 sm:h-auto shrink-0 bg-secondary overflow-hidden">
                  <img
                    src={assetPath(edu.logo || "/education.jpg")}
                    alt={edu.school}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content (right) */}
                <div className="flex-1 p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-2">
                    <h3 className="font-display font-semibold text-lg text-foreground">
                      {edu.school}
                    </h3>
                    <span className="mono-label text-muted-foreground shrink-0">{edu.period}</span>
                  </div>
                  <p className="text-sm font-medium text-brand mb-1">{edu.degree}</p>
                  <p className="mono-label text-muted-foreground normal-case tracking-normal mb-3">{edu.location}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{edu.description}</p>

                  {/* Achievements */}
                  {edu.achievements && edu.achievements.length > 0 && (
                    <ul className="mt-4 space-y-1.5">
                      {edu.achievements.map((a) => (
                        <li key={a} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Award size={14} className="mt-0.5 shrink-0 text-brand" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Relevant coursework */}
                  {edu.coursework && edu.coursework.length > 0 && (
                    <div className="mt-4">
                      <p className="mono-label text-muted-foreground mb-2">Relevant Coursework</p>
                      <div className="flex flex-wrap gap-1.5">
                        {edu.coursework.map((c) => (
                          <span key={c} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary ring-line text-muted-foreground font-medium">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Highlights */}
                  {edu.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {edu.highlights.map((h) => (
                        <span key={h} className="text-[11px] px-2.5 py-1 rounded-full bg-brand/10 ring-1 ring-brand/20 text-brand font-medium">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-2 mb-6">
              <Award size={18} className="text-brand" />
              <h3 className="font-display font-semibold text-xl text-foreground">Certifications</h3>
              <span className="mono-label text-muted-foreground">({certifications.length})</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {certifications.map((cert, idx) => (
                <article
                  key={idx}
                  className="group surface surface-hover overflow-hidden flex flex-col"
                >
                  {/* Proof image (click to zoom) */}
                  <button
                    type="button"
                    onClick={() => cert.image && setLightbox(cert)}
                    disabled={!cert.image}
                    aria-label={cert.image ? `View certificate: ${cert.name}` : cert.name}
                    className={`relative block aspect-[4/3] w-full overflow-hidden bg-secondary ${cert.image ? "cursor-zoom-in" : "cursor-default"}`}
                  >
                    {cert.image ? (
                      <>
                        <img
                          src={assetPath(cert.image)}
                          alt={`${cert.name} certificate`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-105"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/30 motion-safe:transition-colors">
                          <ZoomIn size={22} className="text-white opacity-0 group-hover:opacity-100 motion-safe:transition-opacity" />
                        </span>
                      </>
                    ) : (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                        <ImageIcon size={22} />
                        <span className="mono-label">No image</span>
                      </span>
                    )}
                  </button>

                  {/* Meta */}
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <p className="font-medium text-sm text-foreground leading-snug">{cert.name}</p>
                    <p className="mono-label text-muted-foreground normal-case tracking-normal">
                      {cert.issuer}{cert.year ? ` · ${cert.year}` : ""}
                    </p>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand hover:underline mt-2 self-start"
                      >
                        View credential
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox?.image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.name}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-secondary ring-line text-foreground hover:ring-strong motion-safe:transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <figure className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={assetPath(lightbox.image)}
              alt={`${lightbox.name} certificate`}
              className="w-full max-h-[80vh] object-contain rounded-lg shadow-card animate-in zoom-in-95 duration-200"
            />
            <figcaption className="mt-3 text-center text-sm text-muted-foreground">
              {lightbox.name}
              {lightbox.issuer ? ` — ${lightbox.issuer}` : ""}
              {lightbox.year ? ` · ${lightbox.year}` : ""}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
