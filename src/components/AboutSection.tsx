import { Sparkles, CheckCircle2, MessageSquare, Users, Award, Compass, BrainCircuit } from 'lucide-react';
import type { AboutData } from '../types/index.ts';

interface AboutSectionProps {
  about: AboutData;
}

export function AboutSection({ about }: AboutSectionProps) {
  const getSoftSkillIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('communicat')) return <MessageSquare className="w-4 h-4 text-cyan-400" />;
    if (lower.includes('network')) return <Users className="w-4 h-4 text-blue-400" />;
    if (lower.includes('leader')) return <Award className="w-4 h-4 text-amber-400" />;
    if (lower.includes('decision')) return <Compass className="w-4 h-4 text-emerald-400" />;
    if (lower.includes('problem')) return <BrainCircuit className="w-4 h-4 text-purple-400" />;
    return <Sparkles className="w-4 h-4 text-cyan-400" />;
  };

  const softSkills = (about.softSkills || []).filter(s => s.enabled);

  return (
    <section id="about" className="relative py-24 bg-[#050712] overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-blue-600/10 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-cyan-600/10 blur-[120px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/25 text-blue-400 text-xs font-mono tracking-widest uppercase mb-3">
            <span>Engineering &amp; Artistry</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display tracking-tight mb-4">
            {about.heading || 'About Me'}
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            {about.intro}
          </p>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Visual: 3D Character (Admin Replaceable) & Metrics */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden border border-blue-500/30 bg-[#090e21] shadow-2xl shadow-blue-900/30 group">
              <img
                src={about.characterImage}
                alt="MD NAYEM HOSSAIN - 3D Character Visual"
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />

              {/* Gradient fade */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#090e21] via-[#090e21]/70 to-transparent" />

              {/* Floating Stat Overlay */}
              <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-blue-500/30">
                <div>
                  <p className="text-2xl font-bold text-cyan-400 font-display">{about.experienceYears || '5+'}</p>
                  <p className="text-xs text-slate-300">Years Technical Craft</p>
                </div>
                <div className="border-l border-slate-800 pl-3">
                  <p className="text-2xl font-bold text-blue-400 font-display">{about.completedProjects || '40+'}</p>
                  <p className="text-xs text-slate-300">Assets &amp; Renders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio Prose & "Soft Skills" Section */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-display mb-4">
              Where Engineering Rigor Powers Cinematic 3D Realism
            </h3>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              {about.detailedBio}
            </p>

            {/* SOFT SKILLS SECTION (NEW CLIENT REQUIREMENT) */}
            <div className="p-6 rounded-3xl bg-[#0b1226]/80 border border-blue-500/25 shadow-xl shadow-black/30 backdrop-blur-sm mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-mono font-semibold uppercase tracking-wider text-cyan-300">
                  Professional Soft Skills
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {softSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-950/80 hover:bg-blue-950/40 border border-blue-500/20 hover:border-cyan-400/40 transition-all duration-200 group"
                  >
                    <div className="p-2 rounded-xl bg-blue-950/90 border border-blue-500/30 group-hover:border-cyan-400/50 shrink-0">
                      {getSoftSkillIcon(skill.name)}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-white">
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtitle notes */}
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interdisciplinary collaboration across engineering, game development &amp; 3D visualization.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
