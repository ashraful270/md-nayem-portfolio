import { GraduationCap, Award, Calendar, Building2, CheckCircle } from 'lucide-react';
import type { EducationItem } from '../types/index.ts';

interface EducationSectionProps {
  education: EducationItem[];
}

export function EducationSection({ education }: EducationSectionProps) {
  return (
    <section id="education" className="relative py-20 bg-[#070b1a] border-t border-blue-950/60 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-600/10 blur-[130px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-mono uppercase tracking-widest mb-3">
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Academic &amp; Technical Foundation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-display tracking-tight mb-3">
            Education &amp; Background
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl">
            Formal engineering rigor and technical education backing high-precision 3D visualizations and industrial modeling.
          </p>
        </div>

        {/* Education Timeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {education.map((item, index) => (
            <div
              key={item.id}
              className="relative rounded-3xl p-6 bg-[#0a0f26]/80 hover:bg-[#0e1638] border border-blue-500/20 hover:border-cyan-400/50 shadow-xl shadow-black/40 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-950/90 border border-blue-500/30 group-hover:border-cyan-400/50 flex items-center justify-center text-cyan-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-400/30 text-cyan-300 text-xs font-mono font-medium">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    <span>{item.year}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white font-display leading-snug group-hover:text-cyan-300 transition-colors mb-2">
                  {item.degree}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 font-medium mb-3">
                  <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{item.institution}</span>
                </p>

                {item.description && (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Card Footer: Academic Score / GPA */}
              <div className="pt-4 border-t border-blue-900/30 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Academic Result
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-semibold">
                  <Award className="w-3 h-3 text-emerald-400" />
                  {item.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
