import { useState, useEffect, lazy, Suspense } from 'react'
import { AboutSection } from './components/about-section'
import { SkillsSection } from './components/skills-section'
import { ContactSection } from './components/contact-section'
import { PortfolioSection } from './components/portfolio-section'
import { EducationSection } from './components/education-section'
import { TopNav } from './components/top-nav'
import { ProjectPage } from './components/portfolio/ProjectPage'
import projectsData from './data/projects.json'
import type { PortfolioItem } from './types/portfolio'

const AdminGate = lazy(() => import('./components/admin/AdminGate').then(m => ({ default: m.AdminGate })));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));

const SECTIONS = ['about', 'portfolio', 'skills', 'education', 'contact'];
const projectItems = projectsData.items as PortfolioItem[];

/** `#project/<id>` → that project's id, otherwise null. */
function projectIdFromHash(hash: string): number | null {
  const m = /^#project\/(\d+)$/.exec(hash);
  return m ? Number(m[1]) : null;
}

// ── Sub-component: Main portfolio view ────────────────────────────────────────
function PortfolioApp() {
  // Seeded from the hash so the nav lights the right item on the first paint
  // when we arrive from a project page; the observer takes over after that.
  const [activeSection, setActiveSection] = useState(() => {
    const target = window.location.hash.slice(1);
    return SECTIONS.includes(target) ? target : 'about';
  });

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Arriving from a project page — via the breadcrumb or the nav header there —
  // the hash names the section to land on. This view re-renders rather than
  // loading the document, so the browser never acts on that fragment itself.
  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (!SECTIONS.includes(target)) return;
    requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ block: 'start' });
    });
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.35 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div className="min-h-screen w-full relative bg-background overflow-x-hidden">
      {/* Dot-grid ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid" />

      <div className="relative z-10">
        <TopNav activeSection={activeSection} onNavigate={handleNavigate} />
        <main>
          <AboutSection />
          <PortfolioSection />
          <SkillsSection />
          <EducationSection />
          <ContactSection />
        </main>
      </div>
    </div>
  );
}

// ── Root: hash-based routing ──────────────────────────────────────────────────
function App() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const projectId = projectIdFromHash(hash);
  if (projectId !== null) {
    const item = projectItems.find((p) => p.id === projectId);
    // An unknown id falls through to the portfolio rather than rendering a blank
    // page — stale links and hand-typed hashes both land somewhere useful.
    if (item) return <ProjectPage item={item} />;
  }

  if (hash === '#admin') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
          Loading admin...
        </div>
      }>
        <AdminGate><AdminPanel /></AdminGate>
      </Suspense>
    );
  }

  return <PortfolioApp />;
}

export default App
