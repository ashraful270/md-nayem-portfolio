import { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, MessageCircle } from 'lucide-react';
import type { NavigationItem } from '../types/index.ts';

interface NavbarProps {
  navItems?: NavigationItem[];
  hireMeText?: string;
  hireMeHref?: string;
}

export function Navbar({ navItems, hireMeText = 'Hire Me' }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const WHATSAPP_URL = 'https://wa.me/8801984382715';

  const defaultNav: NavigationItem[] = [
    { id: '1', label: 'Home', href: '#home', order: 1, enabled: true },
    { id: '2', label: 'About Me', href: '#about', order: 2, enabled: true },
    { id: '3', label: 'My Projects', href: '#projects', order: 3, enabled: true },
    { id: '4', label: 'My Achievements', href: '#achievements', order: 4, enabled: true },
    { id: '5', label: 'Contact', href: '#contact', order: 5, enabled: true },
  ];

  const items = (navItems && navItems.length > 0 ? navItems : defaultNav).filter(i => i.enabled);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Track active section based on scroll position
      const sections = items.map(item => item.href.replace('#', '')).filter(Boolean);
      for (const sectionId of sections.reverse()) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  const scrollTo = (href: string) => {
    setMobileMenuOpen(false);
    const target = href.startsWith('#') ? document.querySelector(href) : null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#050711]/90 backdrop-blur-xl border-b border-blue-900/30 shadow-lg shadow-black/50 py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo: ONLY "MD NAYEM HOSSAIN", NO ICON/SYMBOL */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('#home');
            }}
            className="group inline-block text-white no-underline transition-colors"
          >
            <span className="font-display font-bold text-base sm:text-lg tracking-wider text-white group-hover:text-cyan-300 transition-colors uppercase">
              MD NAYEM HOSSAIN
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-[#0b1226]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-blue-500/20 shadow-inner shadow-blue-500/5">
            {items.map((item) => {
              const secId = item.href.replace('#', '');
              const isActive = activeSection === secId;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(item.href);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 relative ${
                    isActive
                      ? 'text-white bg-blue-600/30 border border-blue-400/40 shadow-sm shadow-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Desktop Hire Me CTA -> Directly opens WhatsApp */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hire Me on WhatsApp"
              className="relative inline-flex items-center gap-2 px-5 py-2 rounded-full font-medium text-xs tracking-wide text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-600/30 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <MessageCircle className="w-3.5 h-3.5 text-cyan-200" />
              <span>{hireMeText}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-white/80" />
            </a>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden p-2 rounded-xl bg-slate-900/80 border border-blue-500/20 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 px-4 pb-6 pt-2 bg-[#070b1a]/95 backdrop-blur-2xl border-b border-blue-900/40 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(item.href);
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-blue-600/20 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2 border-t border-slate-800">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-600/30"
              >
                <MessageCircle className="w-4 h-4 text-cyan-200" />
                <span>{hireMeText}</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
