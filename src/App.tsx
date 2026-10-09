import { useState, useEffect } from 'react';
import { fetchSiteData, getAuthToken, removeAuthToken } from './lib/api.ts';
import type { SiteData } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { EducationSection } from './components/EducationSection.tsx';
import { ProjectsSection } from './components/ProjectsSection.tsx';
import { AchievementsSection } from './components/AchievementsSection.tsx';
import { ContactSection } from './components/ContactSection.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminLogin } from './admin/AdminLogin.tsx';
import { AdminDashboard } from './admin/AdminDashboard.tsx';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin routing state
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return window.location.pathname === '/admin' || window.location.hash === '#admin';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(getAuthToken());
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchSiteData();
      setSiteData(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load portfolio site data:', err);
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to hash changes for #admin
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setIsAdminMode(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenAdmin = () => {
    setIsAdminMode(true);
    window.location.hash = '#admin';
  };

  const handleBackToSite = () => {
    setIsAdminMode(false);
    if (window.location.hash === '#admin') {
      window.history.pushState('', document.title, window.location.pathname);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsAdminAuthenticated(false);
    handleBackToSite();
  };

  if (loading && !siteData) {
    return (
      <div className="min-h-screen bg-[#050711] flex flex-col items-center justify-center text-white">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full border-2 border-blue-500/20 border-t-cyan-400 animate-spin" />
          <Loader2 className="w-6 h-6 text-cyan-400 absolute animate-pulse" />
        </div>
        <p className="font-display font-semibold text-lg text-white">MD NAYEM HOSSAIN</p>
        <p className="text-xs font-mono text-cyan-400/80 mt-1">Loading 3D Portfolio &amp; Engine...</p>
      </div>
    );
  }

  if (error && !siteData) {
    return (
      <div className="min-h-screen bg-[#050711] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="p-6 rounded-3xl bg-rose-950/40 border border-rose-500/30 max-w-md">
          <p className="font-display text-lg text-rose-300 font-bold mb-2">Connection Error</p>
          <p className="text-xs text-slate-300 mb-4">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!siteData) return null;

  /* =========================================================================
     ADMIN VIEWPORT
     ========================================================================= */
  if (isAdminMode) {
    if (!isAdminAuthenticated) {
      return (
        <AdminLogin
          onLoginSuccess={() => setIsAdminAuthenticated(true)}
          onBackToSite={handleBackToSite}
        />
      );
    }

    return (
      <AdminDashboard
        initialData={siteData}
        onRefreshData={loadData}
        onLogout={handleLogout}
        onBackToSite={handleBackToSite}
      />
    );
  }

  /* =========================================================================
     PUBLIC PORTFOLIO VIEWPORT
     ========================================================================= */
  return (
    <div className="min-h-screen bg-[#050711] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Sticky Glass Navbar */}
      <Navbar
        navItems={siteData.navigation?.items}
        hireMeText={siteData.navigation?.hireMeText}
        hireMeHref={siteData.navigation?.hireMeHref}
      />

      <main className="flex-1">
        {/* 1. Hero Section with 3D Character & Floating Skills */}
        <HeroSection hero={siteData.hero} skills={siteData.skills} />

        {/* 2. About Me Section with 3D Character & Think/Create/Build */}
        <AboutSection about={siteData.about} />

        {/* 3. Educational / Professional Background */}
        <EducationSection education={siteData.education} />

        {/* 4. My Projects Section with interactive 3D model inspector */}
        <ProjectsSection projects={siteData.projects} categories={siteData.categories} />

        {/* 5. My Achievements Section (SSR Award, National Olympiad) */}
        <AchievementsSection achievements={siteData.achievements} />

        {/* 6. Angled Contact Section with real working backend form */}
        <ContactSection settings={siteData.settings} />
      </main>

      {/* 7. Footer with dynamic copyright & subtle Admin CMS link */}
      <Footer
        footer={siteData.footer}
        socials={siteData.socials}
        navItems={siteData.navigation?.items || []}
        contactEmail={siteData.settings?.contactEmail || 'nayemh161@gmail.com'}
        onOpenAdmin={handleOpenAdmin}
      />
    </div>
  );
}
