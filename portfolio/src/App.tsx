import { useState, useEffect, lazy, Suspense } from 'react'
import { AboutSection } from './components/about-section'
import { SkillsSection } from './components/skills-section'
import { ContactSection } from './components/contact-section'
import { PortfolioSection } from './components/portfolio-section'
import { EducationSection } from './components/education-section'
import { TopNav } from './components/top-nav'

const AdminGate = lazy(() => import('./components/admin/AdminGate').then(m => ({ default: m.AdminGate })));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));

const SECTIONS = ['about', 'portfolio', 'skills', 'education', 'contact'];

// ── Sub-component: Main portfolio view ────────────────────────────────────────
function PortfolioApp() {
  const [activeSection, setActiveSection] = useState('about');

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

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
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin');

  useEffect(() => {
    const onHash = () => setIsAdmin(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (isAdmin) {
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
