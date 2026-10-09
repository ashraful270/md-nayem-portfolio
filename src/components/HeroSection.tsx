import { useState } from 'react';
import { ArrowRight, Sparkles, Box, Wrench, BarChart3, Code2, ShieldCheck, Palette, FileSpreadsheet, Eye } from 'lucide-react';
import type { HeroData, SkillItem } from '../types/index.ts';

interface HeroSectionProps {
  hero: HeroData;
  skills: SkillItem[];
}

export function HeroSection({ hero, skills }: HeroSectionProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Icon mapping for skills
  const getSkillIcon = (iconName: string, skillName: string) => {
    switch (iconName.toLowerCase()) {
      case 'box':
        return <Box className="w-5 h-5 text-cyan-400" />;
      case 'wrench':
        return <Wrench className="w-5 h-5 text-blue-400" />;
      case 'barchart3':
        return <BarChart3 className="w-5 h-5 text-amber-400" />;
      case 'code2':
        return <Code2 className="w-5 h-5 text-emerald-400" />;
      case 'shieldcheck':
        return <ShieldCheck className="w-5 h-5 text-purple-400" />;
      case 'palette':
        return <Palette className="w-5 h-5 text-pink-400" />;
      case 'filespreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-teal-400" />;
      default:
        if (skillName.toLowerCase().includes('blender')) return <Box className="w-5 h-5 text-orange-400" />;
        if (skillName.toLowerCase().includes('solid')) return <Wrench className="w-5 h-5 text-blue-400" />;
        if (skillName.toLowerCase().includes('matlab')) return <BarChart3 className="w-5 h-5 text-amber-400" />;
        if (skillName.toLowerCase().includes('c prog')) return <Code2 className="w-5 h-5 text-emerald-400" />;
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  const floatingSkills = skills.filter(s => s.isFloatingHero && s.enabled);

  const scrollTo = (href: string) => {
    const target = href.startsWith('#') ? document.querySelector(href) : null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen pt-28 pb-16 flex flex-col justify-between overflow-hidden">
      {/* Background radial atmosphere glow matching Figma reference */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-cyan-500/10 blur-[130px] -z-10 pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-blue-700/10 blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-700/10 blur-[110px] -z-10 pointer-events-none" />

      {/* Subtle grid texture overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-center">
        {/* Main 3-Column Hero Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">

          {/* LEFT COLUMN: Main Heading & Bio */}
          <div className="lg:col-span-4 flex flex-col justify-center text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-mono tracking-wide w-fit mb-5 shadow-sm shadow-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Available for 3D & CAD Projects</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[46px] font-bold text-white tracking-tight leading-[1.15] mb-5 font-display">
              {hero.heading.split('&').length > 1 ? (
                <>
                  <span>{hero.heading.split('&')[0]}</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">
                    &amp; {hero.heading.split('&')[1]}
                  </span>
                </>
              ) : (
                hero.heading
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-8 max-w-md">
              "{hero.bio}"
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={hero.ctaLink || '#projects'}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(hero.ctaLink || '#projects');
                }}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/35 hover:shadow-blue-500/50 transition-all duration-300 hover:translate-y-[-2px] active:translate-y-[0px]"
              >
                <span>{hero.ctaText || 'View My Projects'}</span>
                <ArrowRight className="w-4 h-4 text-cyan-200" />
              </a>

              <a
                href={hero.secondaryCtaLink || 'https://wa.me/8801984382715'}
                target={hero.secondaryCtaLink?.startsWith('http') ? '_blank' : undefined}
                rel={hero.secondaryCtaLink?.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={(e) => {
                  if (hero.secondaryCtaLink?.startsWith('#')) {
                    e.preventDefault();
                    scrollTo(hero.secondaryCtaLink);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-sm font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800/80 border border-blue-500/30 transition-all duration-200 cursor-pointer"
              >
                <span>{hero.secondaryCtaText || 'Hire Me'}</span>
              </a>
            </div>
          </div>

          {/* CENTER COLUMN: 3D Character Visual Composition */}
          <div className="lg:col-span-4 flex items-center justify-center relative order-1 lg:order-2 my-4 lg:my-0">
            {/* Glowing circular portal frame */}
            <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-sm aspect-[3/4] flex items-center justify-center">
              {/* Backglow ring */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-b from-blue-600/40 via-cyan-500/20 to-transparent blur-2xl -z-10 animate-pulse duration-1000" />
              <div className="absolute inset-0 rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-900/10 via-slate-950/40 to-[#050711] shadow-2xl shadow-blue-900/40 overflow-hidden group">
                {/* 3D Character Image (Admin replaceable) */}
                <img
                  src={hero.characterImage}
                  alt="MD NAYEM HOSSAIN - 3D Character Visualization"
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="eager"
                />

                {/* Cyber gradient overlay at base */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050711] via-[#050711]/60 to-transparent pointer-events-none" />

                {/* Floating badge inside visual */}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-[#090e21]/80 backdrop-blur-md border border-blue-400/25 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">3D Visualization</p>
                    <p className="text-xs font-semibold text-white">Octane &amp; Blender Cycles</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-cyan-400/40 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Secondary Intro & Domain Specialization */}
          <div className="lg:col-span-4 flex flex-col justify-center text-left lg:text-left order-3">
            <div className="bg-[#0b1226]/60 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-blue-500/20 shadow-xl shadow-black/40 relative">
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>

              <p className="text-sm font-semibold tracking-wider text-cyan-400 uppercase font-mono mb-2">
                {hero.rightGreeting || 'Hello! I Am MD NAYEM HOSSAIN'}
              </p>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 font-display tracking-tight leading-snug">
                {hero.rightTitle || '3D modeling and product visualization'}
              </h2>

              <p className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>{hero.rightRole || 'A designer who'}</span>
              </p>

              <p className="text-sm text-slate-400 leading-relaxed">
                {hero.rightSubtitle ||
                  'You will get here huge game assets achieve elements, and industrial product design with proper management.'}
              </p>

              <div className="mt-6 pt-4 border-t border-blue-900/30 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  EEE Precision
                </span>
                <span className="text-slate-400">Production-Ready Assets</span>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM HERO: Animated Floating Skill Icons */}
        <div className="mt-14 pt-8 border-t border-blue-950/70">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
              Core Technical Software &amp; Tooling
            </span>
            <span className="text-[11px] font-mono text-cyan-400/80">
              Hover icon to inspect tool proficiency
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
            {floatingSkills.map((skill, index) => {
              const isHovered = activeTooltip === skill.id;
              return (
                <div
                  key={skill.id}
                  onMouseEnter={() => setActiveTooltip(skill.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="relative group"
                  style={{
                    animation: `float 4s ease-in-out infinite`,
                    animationDelay: `${index * 0.35}s`,
                  }}
                >
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#090e21]/90 hover:bg-[#0f1738] border border-blue-500/25 hover:border-cyan-400/60 shadow-lg shadow-black/40 hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                    <div className="p-1.5 rounded-xl bg-blue-950/80 border border-blue-500/20 group-hover:border-cyan-400/40">
                      {getSkillIcon(skill.icon, skill.name)}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-white">
                      {skill.name}
                    </span>
                  </div>

                  {/* Hover Tooltip / Proficiency bar */}
                  {isHovered && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-400/40 text-[11px] font-mono text-white shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-300 font-semibold">{skill.name}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-emerald-400">{skill.proficiency}% Mastery</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
