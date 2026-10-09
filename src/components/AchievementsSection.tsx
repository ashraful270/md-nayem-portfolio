import { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Star,
  Sparkles,
  CheckCircle2,
  Crown,
  Calendar,
  Building,
  ExternalLink,
  X,
  Eye,
  ZoomIn,
} from 'lucide-react';
import type { AchievementItem } from '../types/index.ts';

interface AchievementsSectionProps {
  achievements: AchievementItem[];
}

function getAchievementIcon(iconName?: string) {
  switch (iconName) {
    case 'Award':
      return Award;
    case 'Medal':
      return Medal;
    case 'Star':
      return Star;
    case 'Sparkles':
      return Sparkles;
    case 'CheckCircle2':
      return CheckCircle2;
    case 'Crown':
      return Crown;
    case 'Trophy':
    default:
      return Trophy;
  }
}

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const [lightboxData, setLightboxData] = useState<{ url: string; title: string; year: string } | null>(null);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxData(null);
      }
    };
    if (lightboxData) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxData]);

  // Filter published items and sort by order
  const displayAchievements = achievements
    .filter((a) => a.published !== false)
    .sort((a, b) => a.order - b.order);

  return (
    <section id="achievements" className="relative py-24 bg-[#060918] border-t border-blue-950/60 overflow-hidden">
      {/* Background glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-500/10 blur-[120px] -z-10 pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest mb-3">
            <Trophy className="w-3.5 h-3.5" />
            <span>Honors &amp; Recognition</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display tracking-tight mb-4">
            My Achievements
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Distinctions celebrating technical innovation, interdisciplinary engineering excellence, and creative leadership.
          </p>
        </div>

        {/* Achievement Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {displayAchievements.map((item) => {
            const certImg = item.image || item.certificateImage;
            const IconComponent = getAchievementIcon(item.icon);

            return (
              <div
                key={item.id}
                className="relative rounded-3xl p-6 sm:p-7 bg-[#090f28]/85 hover:bg-[#0d163a] border border-blue-500/25 hover:border-amber-400/50 shadow-2xl shadow-black/50 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5"
              >
                {/* Corner Glow effect */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 group-hover:bg-amber-500/10 rounded-tr-3xl blur-2xl pointer-events-none transition-colors" />

                <div>
                  {/* =========================================================
                      1. ACHIEVEMENT IMAGE (AT THE VERY TOP OF THE CARD)
                     ========================================================= */}
                  <div
                    onClick={() => {
                      if (certImg) {
                        setLightboxData({ url: certImg, title: item.title, year: item.year });
                      }
                    }}
                    className={`relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-slate-950/90 border border-blue-500/25 mb-5 shadow-inner transition-colors ${
                      certImg ? 'cursor-pointer group/img' : ''
                    }`}
                  >
                    {certImg ? (
                      <>
                        <img
                          src={certImg}
                          alt={`${item.title} certificate`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                          loading="lazy"
                        />
                        {/* Hover Overlay with Lightbox indicator */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-blue-950/30 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                          <span className="px-3.5 py-1.5 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-mono font-medium flex items-center gap-2 shadow-lg backdrop-blur-sm transition-all transform translate-y-1 group-hover/img:translate-y-0">
                            <ZoomIn className="w-3.5 h-3.5 text-cyan-300" />
                            <span>View Full Certificate</span>
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-950/40 via-purple-950/20 to-slate-950 text-slate-500 p-6 text-center">
                        <Trophy className="w-10 h-10 text-blue-500/40 mb-2" />
                        <span className="text-xs font-mono text-slate-400">Official Certificate Verified</span>
                      </div>
                    )}
                  </div>

                  {/* =========================================================
                      2. ICON & 3. YEAR
                     ========================================================= */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    {/* 2. ICON (BELOW IMAGE) */}
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 group-hover:border-amber-400/60 flex items-center justify-center text-amber-400 shadow-md shadow-amber-950/40 transition-colors">
                      <IconComponent className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>

                    {/* 3. YEAR */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/30 text-amber-300 text-xs font-mono font-medium">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{item.year}</span>
                    </div>
                  </div>

                  {/* =========================================================
                      4. TITLE
                     ========================================================= */}
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-display group-hover:text-amber-300 transition-colors mb-2 leading-snug">
                    {item.title}
                  </h3>

                  {/* =========================================================
                      5. SUBTITLE & SHORT DESCRIPTION
                     ========================================================= */}
                  {item.organization && (
                    <p className="text-xs sm:text-sm text-cyan-400 font-medium flex items-center gap-1.5 mb-2 font-mono">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.organization}</span>
                    </p>
                  )}

                  {item.subtitle && (
                    <p className="text-xs sm:text-sm font-semibold text-slate-200 mb-2">
                      {item.subtitle}
                    </p>
                  )}

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    {item.description || item.subtitle}
                  </p>
                </div>

                {/* Footer Link & Verification */}
                <div className="pt-4 border-t border-blue-900/40 flex items-center justify-between text-xs mt-2">
                  <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Official Recognition
                  </span>

                  {item.externalLink && (
                    <a
                      href={item.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium underline-offset-4 hover:underline"
                    >
                      <span>Verification Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxData && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxData(null)}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-4xl flex items-center justify-between mb-3 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white font-display">{lightboxData.title}</h4>
              <span className="text-xs font-mono text-amber-400">Award Year: {lightboxData.year}</span>
            </div>
            <button
              type="button"
              onClick={() => setLightboxData(null)}
              className="p-2 rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Certificate Image Frame */}
          <div
            className="relative max-w-4xl max-h-[82vh] rounded-2xl overflow-hidden border border-blue-500/40 shadow-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxData.url}
              alt={lightboxData.title}
              className="max-w-full max-h-[82vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}
