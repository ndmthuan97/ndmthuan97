import { useState, useEffect, lazy, Suspense } from 'react'
import { HeroSection } from './components/home-section'
import { AboutSection } from './components/about-section'
import { SkillsSection } from './components/skills-section'
import { ContactSection } from './components/contact-section'
import { PortfolioSection } from './components/portfolio-section'
import { SideNav } from './components/side-nav'

const AdminGate = lazy(() => import('./components/admin/AdminGate').then(m => ({ default: m.AdminGate })));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));

const SECTIONS = ['home', 'about', 'skills', 'portfolio', 'contact'];

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin');

  useEffect(() => {
    const onHash = () => setIsAdmin(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Admin mode — render separately, no SideNav
  if (isAdmin) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-figma-bg flex items-center justify-center text-muted-foreground text-sm">Loading admin...</div>}>
        <AdminGate><AdminPanel /></AdminGate>
      </Suspense>
    );
  }

  // Auto-detect active section on scroll via IntersectionObserver
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

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="dark min-h-screen w-full relative bg-figma-bg overflow-x-hidden">
      {/* Figma purple radial glow background layers */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="figma-glow-layer figma-glow-top" />
        <div className="figma-glow-layer figma-glow-mid" />
        <div className="figma-glow-layer figma-glow-right" />
        <div className="figma-glow-layer figma-glow-bottom" />
      </div>

      <div className="relative z-10">
        <SideNav activeSection={activeSection} onNavigate={handleNavigate} />
        <main>
          <HeroSection onNavigate={handleNavigate} />
          <AboutSection />
          <SkillsSection />
          <PortfolioSection />
          <ContactSection />
        </main>
      </div>
    </div>
  )
}

export default App
