import { Linkedin, MessageCircle, Globe, Facebook, Palette, Shield, ArrowUp } from 'lucide-react';
import type { FooterData, SocialLink, NavigationItem } from '../types/index.ts';

interface FooterProps {
  footer: FooterData;
  socials: SocialLink[];
  navItems: NavigationItem[];
  contactEmail: string;
  onOpenAdmin: () => void;
}

export function Footer({ footer, socials, navItems, contactEmail, onOpenAdmin }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const getSocialIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'messagecircle':
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4" />;
      case 'palette':
      case 'artstation':
        return <Palette className="w-4 h-4" />;
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollTo = (href: string) => {
    const target = href.startsWith('#') ? document.querySelector(href) : null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-[#03050d] border-t border-blue-950/80 pt-16 pb-12 overflow-hidden text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-blue-950/60">

          {/* Brand Info: NAME STANDS ALONE, NO LOGO OR ICON */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <div className="mb-3">
                <span className="font-display font-bold text-xl text-white tracking-wider uppercase block">
                  {footer.brandName || 'MD NAYEM HOSSAIN'}
                </span>
                <span className="text-xs font-mono text-cyan-400/90 mt-1 block tracking-wide">
                  {footer.tagline || 'EEE Engineer & Professional 3D Artist'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
                Professional 3D Artist and Electrical &amp; Electronic Engineer specializing in high-fidelity 3D modeling, game asset optimization, and industrial CAD visualization.
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5">
              {socials.filter(s => s.enabled).map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.platform}
                  className="w-9 h-9 rounded-xl bg-slate-900/80 hover:bg-blue-600 border border-blue-500/20 hover:border-cyan-400 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200"
                >
                  {getSocialIcon(social.icon || social.platform)}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-4">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {navItems.filter(i => i.enabled).map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(item.href);
                    }}
                    className="hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 group-hover:bg-cyan-400 transition-colors" />
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Contact info & Scroll to top */}
          <div className="md:col-span-3 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-4">
                Inquiries
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">
                Have a proposal or commission?
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="text-xs sm:text-sm font-mono text-slate-200 hover:text-cyan-300 transition-colors underline-offset-4 hover:underline block"
              >
                {contactEmail}
              </a>
              <a
                href="https://wa.me/8801984382715"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-emerald-400 hover:underline mt-2 inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>+8801984-382715 (WhatsApp)</span>
              </a>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-blue-500/20 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Back to Top</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Dedicated Subtle Admin Link */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div>
            © {currentYear} MD NAYEM HOSSAIN. All rights reserved.
          </div>

          {/* Discreet Admin Entry Link */}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors px-2 py-1 rounded cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin CMS</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
