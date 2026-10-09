import { useState } from 'react';
import { Eye, Box, X, Film, Images, Calendar, User, Layers, Tag, ExternalLink } from 'lucide-react';
import type { ProjectItem, CategoryItem } from '../types/index.ts';
import { ThreeModelViewer } from './ThreeModelViewer.tsx';

interface ProjectsSectionProps {
  projects: ProjectItem[];
  categories: CategoryItem[];
}

export function ProjectsSection({ projects, categories }: ProjectsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'render' | '3d' | 'gallery' | 'video'>('render');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(9);

  // Filter projects by category
  const filteredProjects = selectedCategory === 'All'
    ? projects
    : projects.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  const displayedProjects = filteredProjects.slice(0, visibleCount);

  const openProjectDetails = (project: ProjectItem) => {
    setSelectedProject(project);
    // Requirement 8: When a user opens a project, the FIRST thing shown MUST be the High-Res Render!
    setActiveModalTab('render');
    setActiveGalleryIndex(0);
  };

  return (
    <section id="projects" className="relative py-24 bg-[#050711] overflow-hidden">
      {/* Background glow highlights */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[140px] -z-10 pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-3">
            <Box className="w-3.5 h-3.5" />
            <span>Featured 3D Art &amp; Industrial CAD</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display tracking-tight mb-4">
            My Projects
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Explore 3D game assets, photorealistic product renders, and precision industrial assemblies engineered with edge-flow discipline.
          </p>

          {/* Category Filter Tabs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-[#090e21] border border-blue-500/20 max-w-3xl">
            <button
              type="button"
              onClick={() => { setSelectedCategory('All'); setVisibleCount(9); }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              All Projects ({projects.length})
            </button>
            {categories.map((cat) => {
              const count = projects.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setSelectedCategory(cat.name); setVisibleCount(9); }}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                    selectedCategory === cat.name
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  {cat.name} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {displayedProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => openProjectDetails(project)}
              className="group cursor-pointer rounded-3xl overflow-hidden bg-[#0a0f24] border border-blue-500/20 hover:border-cyan-400/50 shadow-xl shadow-black/50 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                <img
                  src={project.thumbnail || project.mainImage}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                  loading="lazy"
                />

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f24] via-transparent to-transparent opacity-80" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono font-medium tracking-wide bg-[#050711]/85 backdrop-blur-md text-cyan-300 border border-blue-500/30">
                    {project.category}
                  </span>

                  {project.has3DModel && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wide bg-blue-600/90 text-white flex items-center gap-1 shadow-sm">
                      <Box className="w-3 h-3" />
                      <span>3D Model</span>
                    </span>
                  )}
                </div>

                {/* Hover Quick Action */}
                <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="px-4 py-2 rounded-full bg-blue-600 text-white font-medium text-xs flex items-center gap-2 shadow-xl shadow-blue-600/50 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <Eye className="w-4 h-4" />
                    <span>View Project Details</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white font-display group-hover:text-cyan-300 transition-colors mb-2 leading-snug">
                    {project.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed mb-4">
                    {project.shortDesc}
                  </p>
                </div>

                {/* Software tags */}
                <div className="pt-3 border-t border-blue-900/30 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(project.software || []).slice(0, 2).map((sw, idx) => (
                      <span key={idx} className="text-blue-300/90">
                        {sw}{idx < Math.min(project.software.length, 2) - 1 ? ' ·' : ''}
                      </span>
                    ))}
                    {(project.software || []).length > 2 && (
                      <span className="text-slate-500">+{project.software.length - 2}</span>
                    )}
                  </div>
                  <span className="text-slate-500">{project.year}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button for 500+ projects scalability */}
        {filteredProjects.length > visibleCount && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 9)}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600/90 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider font-mono shadow-xl shadow-blue-600/25 transition-all duration-200 hover:scale-105 cursor-pointer border border-blue-400/30"
            >
              <span>Load More Projects</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-950/80 text-cyan-300 text-[10px]">
                +{Math.min(9, filteredProjects.length - visibleCount)} of {filteredProjects.length - visibleCount} remaining
              </span>
            </button>
          </div>
        )}

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 text-slate-400 font-mono text-sm">
            No projects in this category yet.
          </div>
        )}
      </div>

      {/* =========================================================================
          PROJECT DETAILS MODAL (Matching Reference Screenshot & Requirements)
         ========================================================================= */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#080d21] border border-blue-500/30 shadow-2xl shadow-blue-900/30 text-white flex flex-col">

            {/* TOP HEADER: Category badge, Year, Close button */}
            <div className="sticky top-0 z-20 flex items-center justify-between p-4 sm:p-5 bg-[#080d21]/95 backdrop-blur-xl border-b border-blue-900/40">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-blue-950/80 border border-blue-500/30 text-cyan-300 font-medium">
                  {selectedProject.category}
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  Year: {selectedProject.year}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Close modal"
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-4 sm:p-7 space-y-6">

              {/* TABS ROW: High-Res Render | Interactive 3D Inspector | Gallery (n) | Video */}
              <div className="flex items-center gap-2 flex-wrap p-1.5 rounded-2xl bg-slate-950/90 border border-blue-500/20 w-fit">
                {/* 1. High-Res Render (Always Available) */}
                <button
                  type="button"
                  onClick={() => setActiveModalTab('render')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeModalTab === 'render'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  High-Res Render
                </button>

                {/* 2. Interactive 3D Inspector (ONLY if project has 3D model) */}
                {selectedProject.has3DModel && (
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('3d')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeModalTab === '3d'
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/40 font-semibold'
                        : 'text-cyan-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>Interactive 3D Inspector</span>
                  </button>
                )}

                {/* 3. Gallery (Dynamic Count, ONLY if gallery images exist) */}
                {selectedProject.gallery && selectedProject.gallery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('gallery')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeModalTab === 'gallery'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Images className="w-3.5 h-3.5" />
                    <span>Gallery ({selectedProject.gallery.length})</span>
                  </button>
                )}

                {/* 4. Video (ONLY if videoUrl exists) */}
                {selectedProject.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('video')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeModalTab === 'video'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 font-semibold'
                        : 'text-indigo-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Video</span>
                  </button>
                )}
              </div>

              {/* LARGE VISUAL AREA ACCORDING TO ACTIVE TAB */}
              <div className="w-full">
                {activeModalTab === '3d' && selectedProject.has3DModel ? (
                  <ThreeModelViewer
                    modelType={selectedProject.model3DType || 'procedural-mech'}
                    modelUrl={selectedProject.model3DUrl}
                    title={`${selectedProject.title} · Realtime 3D Viewport`}
                  />
                ) : activeModalTab === 'gallery' && selectedProject.gallery && selectedProject.gallery.length > 0 ? (
                  <div className="space-y-4">
                    <div
                      className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-black border border-blue-900/40 cursor-zoom-in"
                      onClick={() => setLightboxImage(selectedProject.gallery[activeGalleryIndex])}
                      title="Click to view full image"
                    >
                      <img
                        src={selectedProject.gallery[activeGalleryIndex]}
                        alt={`${selectedProject.title} gallery render`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* Gallery Thumbnails */}
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                      {selectedProject.gallery.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveGalleryIndex(idx)}
                          className={`w-20 sm:w-24 h-14 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                            activeGalleryIndex === idx
                              ? 'border-cyan-400 ring-2 ring-cyan-500/30'
                              : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="thumb" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : activeModalTab === 'video' && selectedProject.videoUrl ? (
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-black border border-blue-900/40 shadow-xl">
                    <video
                      src={selectedProject.videoUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  /* High-Res Render (Default) */
                  <div
                    className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-black border border-blue-900/40 shadow-xl cursor-zoom-in group"
                    onClick={() => setLightboxImage(selectedProject.highResImage || selectedProject.mainImage || selectedProject.thumbnail)}
                    title="Click for full resolution"
                  >
                    <img
                      src={selectedProject.highResImage || selectedProject.mainImage || selectedProject.thumbnail}
                      alt={selectedProject.title}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-sm text-[11px] font-mono text-cyan-300 border border-blue-500/20 pointer-events-none">
                      Click to expand render
                    </div>
                  </div>
                )}
              </div>

              {/* PROJECT TITLE BELOW VISUAL AREA */}
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white font-display mb-3">
                  {selectedProject.title}
                </h3>
                {/* PROJECT DESCRIPTION BELOW TITLE */}
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 whitespace-pre-line">
                  {selectedProject.fullDesc || selectedProject.shortDesc}
                </p>
              </div>

              {/* PROJECT METADATA GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#0b1228] border border-blue-500/20 text-xs">
                <div>
                  <span className="text-slate-400 block font-mono text-[11px] uppercase mb-1">Software Used</span>
                  <div className="flex flex-wrap gap-1">
                    {(selectedProject.software || []).map((sw, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-blue-950 text-cyan-300 font-medium">
                        {sw}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-mono text-[11px] uppercase mb-1">Client / Purpose</span>
                  <span className="text-slate-200 font-medium">{selectedProject.client || 'Portfolio Production'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-mono text-[11px] uppercase mb-1">Year / Timeline</span>
                  <span className="text-slate-200 font-medium">{selectedProject.year}</span>
                </div>
              </div>

              {/* Tags */}
              {selectedProject.tags && selectedProject.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-xs text-slate-400 font-mono">Tags:</span>
                  {selectedProject.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR FULL RESOLUTION RENDERS */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full size render"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </section>
  );
}
