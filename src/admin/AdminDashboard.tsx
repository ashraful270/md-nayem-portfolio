import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Home,
  User,
  GraduationCap,
  Sparkles,
  Box,
  FolderTree,
  Trophy,
  Mail,
  Share2,
  Settings,
  LogOut,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  X,
  Upload,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Layers,
  Film,
  Images,
  Menu,
  Lock,
  ShieldCheck,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Award,
  Medal,
  Star,
  Crown,
  CheckCircle2,
  Search,
  Database,
  Server,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { authHeaders, uploadMedia } from '../lib/api.ts';
import type {
  SiteData,
  ProjectItem,
  SkillItem,
  EducationItem,
  AchievementItem,
  CategoryItem,
  ContactMessage,
  SocialLink,
  SoftSkillItem,
} from '../types/index.ts';

interface AdminDashboardProps {
  initialData: SiteData;
  onRefreshData: () => Promise<void>;
  onLogout: () => void;
  onBackToSite: () => void;
}

type TabType =
  | 'overview'
  | 'hero'
  | 'about'
  | 'education'
  | 'skills'
  | 'projects'
  | 'categories'
  | 'achievements'
  | 'messages'
  | 'socials'
  | 'nav_footer'
  | 'settings';

export function AdminDashboard({
  initialData,
  onRefreshData,
  onLogout,
  onBackToSite,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [data, setData] = useState<SiteData>(initialData);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastState, setToastState] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // In-app permanent confirmation modal (replaces window.confirm)
  interface ConfirmModalData {
    title: string;
    message: string;
    itemName?: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void>;
  }
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Editing state for Project Modal
  const [editingProject, setEditingProject] = useState<Partial<ProjectItem> | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);

  // Editing state for Education Modal
  const [editingEdu, setEditingEdu] = useState<Partial<EducationItem> | null>(null);

  // Editing state for Skill Modal
  const [editingSkill, setEditingSkill] = useState<Partial<SkillItem> | null>(null);

  // Editing state for Soft Skill Modal
  const [editingSoftSkill, setEditingSoftSkill] = useState<{ id?: string; name: string } | null>(null);

  // Editing state for Achievement Modal
  const [editingAch, setEditingAch] = useState<Partial<AchievementItem> | null>(null);

  // Editing state for Category Modal
  const [editingCat, setEditingCat] = useState<{ id?: string; name: string } | null>(null);

  // Editing state for Social Link Modal
  const [editingSoc, setEditingSoc] = useState<Partial<SocialLink> | null>(null);

  // Project search, filtering and pagination state for 500+ projects
  const [projectSearch, setProjectSearch] = useState('');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState('All');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [projectPage, setProjectPage] = useState(1);
  const [systemStatus, setSystemStatus] = useState<{
    database?: { mode: string; mongoConnected: boolean; connectionState: string };
    mediaStorage?: { provider: string; cloudinaryConfigured?: boolean };
    counts?: { totalProjects: number; publishedProjects: number; totalMessages: number };
  } | null>(null);

  const PROJECTS_PER_PAGE = 12;

  // Filtered & Paginated Projects memo
  const filteredAdminProjects = useMemo(() => {
    return data.projects.filter((p) => {
      const q = projectSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        p.title.toLowerCase().includes(q) ||
        p.shortDesc.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q))) ||
        (p.software && p.software.some((s) => s.toLowerCase().includes(q)));

      const matchesCat = projectCategoryFilter === 'All' || p.category.toLowerCase() === projectCategoryFilter.toLowerCase();
      const matchesStatus =
        projectStatusFilter === 'all' ||
        (projectStatusFilter === 'published' ? p.published : !p.published);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [data.projects, projectSearch, projectCategoryFilter, projectStatusFilter]);

  const totalAdminProjectPages = Math.ceil(filteredAdminProjects.length / PROJECTS_PER_PAGE) || 1;
  const paginatedAdminProjects = filteredAdminProjects.slice(
    (projectPage - 1) * PROJECTS_PER_PAGE,
    projectPage * PROJECTS_PER_PAGE
  );

  // Password change state
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastState({ message, type });
    setTimeout(() => setToastState(null), 3500);
  };

  // Fetch messages and latest data
  const loadMessages = async () => {
    try {
      const res = await fetch('/api/messages', { headers: authHeaders() });
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
      }

      const statusRes = await fetch('/api/admin/system-status', { headers: authHeaders() });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSystemStatus(statusData);
      }
    } catch (e) {
      console.error('Failed to load messages or system status:', e);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // Sync prop changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  /* ==========================================================================
     HERO CMS SAVE
     ========================================================================== */
  const handleSaveHero = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hero', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data.hero),
      });
      if (!res.ok) throw new Error('Failed to update Hero');
      await onRefreshData();
      showToast('Hero section updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update Hero section', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================================
     ABOUT CMS SAVE
     ========================================================================== */
  const handleSaveAbout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/about', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data.about),
      });
      if (!res.ok) throw new Error('Failed to update About');
      await onRefreshData();
      showToast('About section updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update About section', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================================
     SETTINGS CMS SAVE
     ========================================================================== */
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data.settings),
      });
      if (!res.ok) throw new Error('Failed to update Settings');
      await onRefreshData();
      showToast('Settings saved successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update Settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================================
     NAV & FOOTER CMS SAVE
     ========================================================================== */
  const handleSaveNavFooter = async () => {
    setLoading(true);
    try {
      await fetch('/api/navigation', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data.navigation),
      });
      await fetch('/api/footer', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data.footer),
      });
      await onRefreshData();
      showToast('Navigation & Footer saved successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update Navigation & Footer', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================================
     CHANGE PASSWORD (COMPLIES STRICTLY WITH FLOW & VALIDATION REQUIREMENTS)
     ========================================================================== */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    const current = passData.currentPassword.trim();
    const newP = passData.newPassword.trim();
    const confirmP = passData.confirmPassword.trim();

    if (!current) {
      const err = 'Please enter your current password';
      setPassError(err);
      showToast(err, 'error');
      return;
    }
    if (!newP) {
      const err = 'Please enter a new password';
      setPassError(err);
      showToast(err, 'error');
      return;
    }
    if (!confirmP) {
      const err = 'Please confirm your new password';
      setPassError(err);
      showToast(err, 'error');
      return;
    }
    if (newP !== confirmP) {
      const err = 'New password and confirmation do not match';
      setPassError(err);
      showToast(err, 'error');
      return;
    }
    if (newP.length < 6) {
      const err = 'New password must be at least 6 characters long';
      setPassError(err);
      showToast(err, 'error');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          currentPassword: current,
          newPassword: newP,
          confirmPassword: confirmP,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Password update failed');
      }

      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPassSuccess('Admin password updated successfully! Persisted securely in database.');
      showToast('Admin password updated successfully!');
    } catch (err: any) {
      const msg = err.message || 'Password update failed';
      setPassError(msg);
      showToast(msg, 'error');
    } finally {
      setIsChangingPass(false);
    }
  };

  /* ==========================================================================
     PROJECT CRUD HANDLERS
     ========================================================================== */
  const handleSaveProject = async () => {
    if (!editingProject?.title?.trim()) {
      showToast('Project title is required', 'error');
      return;
    }
    setLoading(true);
    try {
      if (isNewProject) {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(editingProject),
        });
        if (!res.ok) throw new Error('Failed to create project');
        const created = await res.json();
        setData((prev) => ({ ...prev, projects: [...prev.projects, created] }));
      } else {
        const res = await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(editingProject),
        });
        if (!res.ok) throw new Error('Failed to update project');
        const updated = await res.json();
        setData((prev) => ({
          ...prev,
          projects: prev.projects.map((p) => (p.id === updated.id ? updated : p)),
        }));
      }
      setEditingProject(null);
      await onRefreshData();
      showToast('Project saved successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save project', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = (proj: ProjectItem) => {
    setConfirmModal({
      title: 'Delete Project Permanently',
      itemName: proj.title,
      message: `Are you sure you want to permanently delete "${proj.title}"? This project, its 3D model link, and gallery renders will be permanently removed from the database.`,
      confirmLabel: 'Delete Project',
      onConfirm: async () => {
        const res = await fetch(`/api/projects/${proj.id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Failed to delete project from database');
        }
        setData((prev) => ({
          ...prev,
          projects: prev.projects.filter((p) => p.id !== proj.id && String(p.id) !== String(proj.id)),
        }));
        await onRefreshData();
        showToast(`Project "${proj.title}" deleted permanently.`);
      },
    });
  };

  const toggleProjectPublished = async (project: ProjectItem) => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ published: !project.published }),
      });
      if (res.ok) {
        const updated = await res.json();
        setData((prev) => ({
          ...prev,
          projects: prev.projects.map((p) => (p.id === updated.id ? updated : p)),
        }));
        await onRefreshData();
        showToast(project.published ? 'Project unpublished (Draft)' : 'Project published!');
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to toggle published status', 'error');
    }
  };

  /* ==========================================================================
     MESSAGES HANDLERS
     ========================================================================== */
  const toggleMessageRead = async (id: string, currentRead: boolean) => {
    try {
      const res = await fetch(`/api/messages/${id}/read`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ read: !currentRead }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, read: !currentRead } : m))
        );
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to update read status', 'error');
    }
  };

  const handleDeleteMessage = (msg: ContactMessage) => {
    setConfirmModal({
      title: 'Delete Contact Inquiry',
      itemName: `Message from ${msg.name}`,
      message: `Are you sure you want to permanently delete this inquiry from ${msg.name} (${msg.email})?`,
      confirmLabel: 'Delete Message',
      onConfirm: async () => {
        const res = await fetch(`/api/messages/${msg.id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Failed to delete message');
        }
        setMessages((prev) => prev.filter((m) => m.id !== msg.id && String(m.id) !== String(msg.id)));
        showToast('Inquiry deleted permanently.');
      },
    });
  };

  /* ==========================================================================
     SHARED CRUD DELETE HANDLERS (RELIABLE IN-UI MODAL CONFIRMATION)
     ========================================================================== */
  const handleDeleteSoftSkill = (skill: SoftSkillItem) => {
    setConfirmModal({
      title: 'Delete Soft Skill',
      itemName: skill.name,
      message: `Are you sure you want to delete the soft skill "${skill.name}"?`,
      confirmLabel: 'Delete Soft Skill',
      onConfirm: async () => {
        const res = await fetch(`/api/soft-skills/${skill.id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete soft skill');
        setData((prev) => ({
          ...prev,
          about: {
            ...prev.about,
            softSkills: (prev.about.softSkills || []).filter((s) => s.id !== skill.id),
          },
        }));
        await onRefreshData();
        showToast(`Soft skill "${skill.name}" removed.`);
      },
    });
  };

  const handleDeleteSkill = (skill: SkillItem) => {
    setConfirmModal({
      title: 'Delete Skill',
      itemName: skill.name,
      message: `Are you sure you want to delete "${skill.name}" from your skills list?`,
      confirmLabel: 'Delete Skill',
      onConfirm: async () => {
        const res = await fetch(`/api/skills/${skill.id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete skill');
        setData((prev) => ({
          ...prev,
          skills: prev.skills.filter((s) => s.id !== skill.id),
        }));
        await onRefreshData();
        showToast(`Skill "${skill.name}" deleted permanently.`);
      },
    });
  };

  const handleDeleteEducation = (edu: EducationItem) => {
    setConfirmModal({
      title: 'Delete Education Entry',
      itemName: edu.degree,
      message: `Are you sure you want to delete "${edu.degree}" from your timeline?`,
      confirmLabel: 'Delete Education',
      onConfirm: async () => {
        const res = await fetch(`/api/education/${edu.id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete education entry');
        setData((prev) => ({
          ...prev,
          education: prev.education.filter((e) => e.id !== edu.id),
        }));
        await onRefreshData();
        showToast(`Education "${edu.degree}" deleted.`);
      },
    });
  };

  const handleDeleteAchievement = (ach: AchievementItem) => {
    setConfirmModal({
      title: 'Delete Achievement',
      itemName: ach.title,
      message: `Are you sure you want to delete "${ach.title}" from your awards and achievements?`,
      confirmLabel: 'Delete Achievement',
      onConfirm: async () => {
        const res = await fetch(`/api/achievements/${ach.id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete achievement');
        setData((prev) => ({
          ...prev,
          achievements: prev.achievements.filter((a) => a.id !== ach.id),
        }));
        await onRefreshData();
        showToast(`Achievement "${ach.title}" removed.`);
      },
    });
  };

  const handleMoveAchievement = async (index: number, direction: 'up' | 'down') => {
    const list = [...data.achievements].sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const currentItem = list[index];
    const targetItem = list[targetIndex];
    const tempOrder = currentItem.order;
    currentItem.order = targetItem.order;
    targetItem.order = tempOrder;

    try {
      const res = await fetch('/api/achievements/reorder', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          orderList: [
            { id: currentItem.id, order: currentItem.order },
            { id: targetItem.id, order: targetItem.order },
          ],
        }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
      await onRefreshData();
      showToast('Achievements reordered successfully');
    } catch {
      showToast('Failed to reorder achievements', 'error');
    }
  };

  const handleTogglePublishAchievement = async (ach: AchievementItem) => {
    try {
      const updatedStatus = ach.published === false;
      const res = await fetch(`/api/achievements/${ach.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ published: updatedStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await onRefreshData();
      showToast(`Achievement "${ach.title}" ${updatedStatus ? 'published' : 'unpublished'}.`);
    } catch {
      showToast('Failed to update publication status', 'error');
    }
  };

  const handleDeleteCategory = (cat: CategoryItem) => {
    setConfirmModal({
      title: 'Delete Project Category',
      itemName: cat.name,
      message: `Are you sure you want to delete the category "${cat.name}"? Filter options will be updated.`,
      confirmLabel: 'Delete Category',
      onConfirm: async () => {
        const res = await fetch(`/api/categories/${cat.id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete category');
        setData((prev) => ({
          ...prev,
          categories: prev.categories.filter((c) => c.id !== cat.id),
        }));
        await onRefreshData();
        showToast(`Category "${cat.name}" deleted.`);
      },
    });
  };

  const handleDeleteSocial = (soc: SocialLink) => {
    setConfirmModal({
      title: 'Delete Social Link',
      itemName: soc.platform,
      message: `Are you sure you want to delete the "${soc.platform}" link?`,
      confirmLabel: 'Delete Social Link',
      onConfirm: async () => {
        const res = await fetch(`/api/socials/${soc.id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete social link');
        setData((prev) => ({
          ...prev,
          socials: prev.socials.filter((s) => s.id !== soc.id),
        }));
        await onRefreshData();
        showToast(`Social link "${soc.platform}" removed.`);
      },
    });
  };

  /* ==========================================================================
     IMAGE / MEDIA UPLOAD HELPER
     ========================================================================== */
  const handleUploadImage = async (file: File, callback: (url: string) => void) => {
    try {
      showToast('Uploading asset...');
      const url = await uploadMedia(file);
      callback(url);
      showToast('Asset uploaded successfully!');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'hero', label: 'Hero / Home CMS', icon: Home },
    { id: 'about', label: 'About Me & Soft Skills', icon: User },
    { id: 'projects', label: 'Projects Management', icon: Box },
    { id: 'categories', label: 'Project Categories', icon: FolderTree },
    { id: 'skills', label: 'Technical Skills & Tools', icon: Sparkles },
    { id: 'education', label: 'Education Timeline', icon: GraduationCap },
    { id: 'achievements', label: 'Achievements & Awards', icon: Trophy },
    {
      id: 'messages',
      label: `Contact Messages ${messages.filter((m) => !m.read).length > 0 ? `(${messages.filter((m) => !m.read).length})` : ''}`,
      icon: Mail,
      badge: messages.filter((m) => !m.read).length || undefined,
    },
    { id: 'socials', label: 'Social Links', icon: Share2 },
    { id: 'nav_footer', label: 'Nav & Footer CMS', icon: Layers },
    { id: 'settings', label: 'Settings & Security', icon: Settings },
  ];

  const currentTabLabel = navigationItems.find((n) => n.id === activeTab)?.label || 'Admin CMS';

  return (
    <div className="min-h-screen bg-[#04060f] text-slate-100 flex flex-col md:flex-row">
      {/* Toast Notification */}
      {toastState && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl text-white font-medium text-xs sm:text-sm shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 border ${
            toastState.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 shadow-rose-950/60'
              : 'bg-slate-900/95 border-cyan-500/50 shadow-cyan-950/60'
          }`}
        >
          {toastState.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span>{toastState.message}</span>
        </div>
      )}

      {/* =====================================================================
          IN-APP DELETE CONFIRMATION MODAL (REPLACES WINDOW.CONFIRM)
         ===================================================================== */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-[#080d24] border border-rose-500/40 p-6 space-y-4 shadow-2xl shadow-rose-950/50 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-white font-display">
                  {confirmModal.title}
                </h3>
                {confirmModal.itemName && (
                  <p className="text-xs font-mono text-cyan-400 mt-1 line-clamp-1">
                    Item: {confirmModal.itemName}
                  </p>
                )}
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await confirmModal.onConfirm();
                    setConfirmModal(null);
                  } catch (err: any) {
                    showToast(err.message || 'Deletion failed', 'error');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{confirmModal.confirmLabel || 'Delete Permanently'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MOBILE TOP BAR (md:hidden)
         ===================================================================== */}
      <header className="md:hidden bg-[#070b1a] border-b border-blue-950/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div>
          <h2 className="font-display font-bold text-sm text-white tracking-wider">
            MD NAYEM HOSSAIN
          </h2>
          <span className="text-[10px] font-mono text-cyan-400 block line-clamp-1">
            {currentTabLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToSite}
            className="p-2 rounded-xl bg-slate-900 border border-blue-500/20 text-slate-300 hover:text-white text-xs cursor-pointer"
            title="Back to Public Site"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white relative cursor-pointer"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {messages.filter((m) => !m.read).length > 0 && !mobileMenuOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* =====================================================================
          MOBILE NAVIGATION DRAWER (md:hidden)
         ===================================================================== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[53px] z-40 bg-[#070b1a]/95 backdrop-blur-xl p-4 overflow-y-auto space-y-3">
          <nav className="space-y-1">
            {navigationItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-white text-[10px] font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-blue-950/60 flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToSite}
              className="flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-900 text-xs font-mono text-slate-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Site</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 py-2 px-3 rounded-xl bg-rose-950/60 text-xs font-mono text-rose-300"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          DESKTOP SIDEBAR NAVIGATION (hidden md:flex)
         ===================================================================== */}
      <aside className="hidden md:flex w-64 bg-[#070b1a] border-r border-blue-950/80 p-4 flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto">
        <div>
          {/* Brand header */}
          <div className="pb-5 mb-4 border-b border-blue-950/60">
            <div className="mb-3">
              <h2 className="font-display font-bold text-base text-white tracking-wider">
                MD NAYEM HOSSAIN
              </h2>
              <span className="text-[10px] font-mono text-cyan-400 block tracking-wide">
                Admin Content Management System
              </span>
            </div>

            <button
              type="button"
              onClick={onBackToSite}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-mono text-slate-300 hover:text-white border border-blue-500/20 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Site</span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 text-xs">
            {navigationItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-blue-950/60 mt-6">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-mono text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* =====================================================================
          MAIN ADMIN CONTENT VIEWPORT
         ===================================================================== */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-h-screen">

        {/* -------------------------------------------------------------------
            TAB: OVERVIEW
           ------------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-8 max-w-6xl">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
                Admin Control Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
                Manage your 3D Artist portfolio content, models, projects, soft skills, and direct leads.
              </p>
            </div>

            {/* Quick KPI Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#090f26] border border-blue-500/20">
                <span className="text-xs font-mono text-slate-400 uppercase block mb-1">Total Projects</span>
                <span className="text-3xl font-bold text-white font-display">{data.projects.length}</span>
                <span className="text-[11px] text-cyan-400 block mt-1 font-mono">
                  {data.projects.filter((p) => p.published).length} Published
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#090f26] border border-blue-500/20">
                <span className="text-xs font-mono text-slate-400 uppercase block mb-1">New Inquiries</span>
                <span className="text-3xl font-bold text-cyan-400 font-display">
                  {messages.filter((m) => !m.read).length}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1 font-mono">
                  {messages.length} total messages
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#090f26] border border-blue-500/20">
                <span className="text-xs font-mono text-slate-400 uppercase block mb-1">Soft Skills</span>
                <span className="text-3xl font-bold text-emerald-400 font-display">
                  {(data.about.softSkills || []).length}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1 font-mono">
                  {(data.about.softSkills || []).filter((s) => s.enabled).length} Active in About
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#090f26] border border-blue-500/20">
                <span className="text-xs font-mono text-slate-400 uppercase block mb-1">Achievements</span>
                <span className="text-3xl font-bold text-amber-400 font-display">{data.achievements.length}</span>
                <span className="text-[11px] text-slate-400 block mt-1 font-mono">Certificates displayed</span>
              </div>
            </div>

            {/* System & Database Infrastructure Status */}
            <div className="p-6 rounded-3xl bg-[#090f26] border border-blue-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span>Production Infrastructure &amp; Persistence</span>
                </h3>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                  500+ Projects Scale Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-white">Database Engine</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${systemStatus?.database?.mongoConnected ? 'bg-emerald-400' : 'bg-cyan-400'} animate-pulse`} />
                    <span className="text-xs font-mono text-cyan-300">
                      {systemStatus?.database?.mode === 'mongodb' ? 'MongoDB Atlas (Persistent Cloud)' : 'Local File Store (data/db.json)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {systemStatus?.database?.mongoConnected
                      ? 'Mongoose ODM connected & indexed for high concurrency.'
                      : 'Set MONGODB_URI in .env to enable MongoDB Atlas persistence.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-white">Media Storage</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${systemStatus?.mediaStorage?.provider === 'cloudinary' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-xs font-mono text-cyan-300">
                      {systemStatus?.mediaStorage?.provider === 'cloudinary' ? 'Cloudinary Object CDN' : 'Local Disk (uploads/)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {systemStatus?.mediaStorage?.provider === 'cloudinary'
                      ? 'Durable CDN storage for GLB 3D models, 4K renders & videos.'
                      : 'Configure CLOUDINARY_* or S3_* in .env for cloud object persistence.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Security &amp; Rate Limits</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono text-emerald-300">Hardened &amp; Active</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    PBKDF2/scrypt password hashing, express-rate-limit, JWT HMAC SHA-256 tokens.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Inquiries Preview */}
            <div className="p-6 rounded-3xl bg-[#090f26] border border-blue-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>Recent Contact Inquiries</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('messages')}
                  className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
                >
                  View All Messages →
                </button>
              </div>

              {messages.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono py-4">No contact inquiries yet.</p>
              ) : (
                <div className="space-y-3">
                  {messages.slice(0, 3).map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">{msg.name}</span>
                          <span className="text-xs text-slate-400 font-mono">({msg.email})</span>
                          {!msg.read && (
                            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-1">{msg.message}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-6 rounded-3xl bg-[#090f26] border border-blue-500/20">
              <h3 className="text-base font-bold text-white font-display mb-4">
                Quick Content Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewProject(true);
                    setEditingProject({
                      title: '',
                      category: '3D Modeling',
                      shortDesc: '',
                      fullDesc: '',
                      tags: ['3D Modeling'],
                      software: ['Blender 3D'],
                      year: '2026',
                      has3DModel: false,
                      gallery: [],
                      published: true,
                      featured: false,
                    });
                    setActiveTab('projects');
                  }}
                  className="p-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-left flex items-center gap-3 cursor-pointer"
                >
                  <Plus className="w-5 h-5 text-cyan-400" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Add New Project</span>
                    <span className="text-[11px] text-slate-400">Upload render, 3D model or video</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('hero')}
                  className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left flex items-center gap-3 cursor-pointer"
                >
                  <Home className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Replace Hero Character</span>
                    <span className="text-[11px] text-slate-400">Update 3D avatar visual</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('about')}
                  className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left flex items-center gap-3 cursor-pointer"
                >
                  <User className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Manage Soft Skills</span>
                    <span className="text-[11px] text-slate-400">Communication, Leadership, etc.</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB: HERO CMS
           ------------------------------------------------------------------- */}
        {activeTab === 'hero' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Hero / Home Section CMS</h1>
                <p className="text-xs text-slate-400 font-mono">
                  Modify main headlines, bio, secondary side copy, and 3D character image.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveHero}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-[#090f26] border border-blue-500/20 space-y-5">
              <h3 className="text-sm font-mono uppercase tracking-wider text-cyan-400">
                Left Column Headline &amp; Bio
              </h3>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={data.hero.heading}
                  onChange={(e) => setData({ ...data, hero: { ...data.hero, heading: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Short Bio Quote
                </label>
                <input
                  type="text"
                  value={data.hero.bio}
                  onChange={(e) => setData({ ...data, hero: { ...data.hero, bio: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                />
              </div>

              {/* Character Image Replacement */}
              <div className="pt-4 border-t border-blue-900/40">
                <h3 className="text-sm font-mono uppercase tracking-wider text-cyan-400 mb-3">
                  Center 3D Character Image (Figma Visual)
                </h3>

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-36 h-48 rounded-2xl overflow-hidden bg-slate-950 border border-blue-500/40 shrink-0">
                    <img
                      src={data.hero.characterImage}
                      alt="Hero 3D Character Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                        Character Image URL
                      </label>
                      <input
                        type="text"
                        value={data.hero.characterImage}
                        onChange={(e) => setData({ ...data, hero: { ...data.hero, characterImage: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                        Upload New Character Render
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadImage(file, (url) => {
                              setData({ ...data, hero: { ...data.hero, characterImage: url } });
                            });
                          }
                        }}
                        className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column Content */}
              <div className="pt-4 border-t border-blue-900/40 space-y-4">
                <h3 className="text-sm font-mono uppercase tracking-wider text-cyan-400">
                  Right Column Details (Figma Hierarchy)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Greeting
                    </label>
                    <input
                      type="text"
                      value={data.hero.rightGreeting}
                      onChange={(e) => setData({ ...data, hero: { ...data.hero, rightGreeting: e.target.value } })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Specialization Title
                    </label>
                    <input
                      type="text"
                      value={data.hero.rightTitle}
                      onChange={(e) => setData({ ...data, hero: { ...data.hero, rightTitle: e.target.value } })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    Role Description
                  </label>
                  <input
                    type="text"
                    value={data.hero.rightRole}
                    onChange={(e) => setData({ ...data, hero: { ...data.hero, rightRole: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    Subtitle Prose
                  </label>
                  <textarea
                    rows={3}
                    value={data.hero.rightSubtitle}
                    onChange={(e) => setData({ ...data, hero: { ...data.hero, rightSubtitle: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB: ABOUT ME & SOFT SKILLS CMS (NEW CLIENT REQUIREMENTS)
           ------------------------------------------------------------------- */}
        {activeTab === 'about' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">About Me &amp; Soft Skills CMS</h1>
                <p className="text-xs text-slate-400 font-mono">
                  Manage introductory text, 3D character image, and client Soft Skills.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveAbout}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save About</span>
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-[#090f26] border border-blue-500/20 space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Section Heading
                </label>
                <input
                  type="text"
                  value={data.about.heading}
                  onChange={(e) => setData({ ...data, about: { ...data.about, heading: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Intro Subtitle
                </label>
                <input
                  type="text"
                  value={data.about.intro}
                  onChange={(e) => setData({ ...data, about: { ...data.about, intro: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Detailed Bio Prose
                </label>
                <textarea
                  rows={4}
                  value={data.about.detailedBio}
                  onChange={(e) => setData({ ...data, about: { ...data.about, detailedBio: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                />
              </div>

              {/* Character Image Replacement */}
              <div className="pt-4 border-t border-blue-900/40">
                <h3 className="text-sm font-mono uppercase tracking-wider text-cyan-400 mb-3">
                  About Section 3D Character Image
                </h3>

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-36 h-48 rounded-2xl overflow-hidden bg-slate-950 border border-blue-500/40 shrink-0">
                    <img
                      src={data.about.characterImage}
                      alt="About Character Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={data.about.characterImage}
                        onChange={(e) => setData({ ...data, about: { ...data.about, characterImage: e.target.value } })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                        Upload Replacement Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadImage(file, (url) => {
                              setData({ ...data, about: { ...data.about, characterImage: url } });
                            });
                          }
                        }}
                        className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SOFT SKILLS MANAGEMENT */}
              <div className="pt-6 border-t border-blue-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-mono uppercase tracking-wider text-cyan-400">
                      Soft Skills Management
                    </h3>
                    <p className="text-xs text-slate-400">
                      Communication, Networking, Leadership Quality, Decision Making, Problem Solving.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingSoftSkill({ name: '' })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Soft Skill</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(data.about.softSkills || []).map((skill) => (
                    <div
                      key={skill.id}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-blue-500/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${skill.enabled ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                        <span className="text-xs sm:text-sm font-medium text-white">{skill.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingSoftSkill(skill)}
                          className="p-1.5 rounded-lg bg-blue-950 text-cyan-300 hover:bg-blue-900 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSoftSkill(skill)}
                          className="p-1.5 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 cursor-pointer"
                          title="Delete Soft Skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Soft Skill Edit Modal */}
            {editingSoftSkill && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="w-full max-w-sm rounded-2xl bg-[#090f26] border border-blue-500/40 p-5 space-y-4">
                  <h3 className="font-bold text-sm text-white font-display">
                    {editingSoftSkill.id ? 'Edit Soft Skill' : 'New Soft Skill'}
                  </h3>
                  <input
                    type="text"
                    required
                    value={editingSoftSkill.name}
                    onChange={(e) => setEditingSoftSkill({ ...editingSoftSkill, name: e.target.value })}
                    placeholder="e.g. Critical Thinking"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSoftSkill(null)}
                      className="px-3 py-1.5 text-xs text-slate-400 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingSoftSkill.name.trim()) return;
                        try {
                          if (editingSoftSkill.id) {
                            const res = await fetch(`/api/soft-skills/${editingSoftSkill.id}`, {
                              method: 'PUT',
                              headers: authHeaders(),
                              body: JSON.stringify({ name: editingSoftSkill.name.trim() }),
                            });
                            if (!res.ok) throw new Error('Update failed');
                          } else {
                            const res = await fetch('/api/soft-skills', {
                              method: 'POST',
                              headers: authHeaders(),
                              body: JSON.stringify({ name: editingSoftSkill.name.trim() }),
                            });
                            if (!res.ok) throw new Error('Create failed');
                          }
                          setEditingSoftSkill(null);
                          await onRefreshData();
                          showToast('Soft skill saved');
                        } catch (e: any) {
                          alert(e.message);
                        }
                      }}
                      className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-xl cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB: PROJECTS CMS (FULL CRUD, VIDEO, GLB 3D, MULTI GALLERY)
           ------------------------------------------------------------------- */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Project Management</h1>
                <p className="text-xs text-slate-400 font-mono">
                  Add, edit, permanently delete, upload high-res renders, gallery images, videos &amp; 3D models.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewProject(true);
                  setEditingProject({
                    title: '',
                    category: data.categories[0]?.name || '3D Modeling',
                    shortDesc: '',
                    fullDesc: '',
                    tags: ['3D Modeling'],
                    software: ['Blender 3D'],
                    year: new Date().getFullYear().toString(),
                    client: '',
                    thumbnail: '/src/assets/images/project_mech_arm_1791315310970.jpg',
                    mainImage: '/src/assets/images/project_mech_arm_1791315310970.jpg',
                    highResImage: '/src/assets/images/project_mech_arm_1791315310970.jpg',
                    gallery: [],
                    videoUrl: '',
                    has3DModel: false,
                    model3DType: 'procedural-torus',
                    featured: false,
                    published: true,
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Project</span>
              </button>
            </div>

            {/* Search, Filter & 500+ Projects Scalability Bar */}
            <div className="p-4 rounded-2xl bg-[#090f26] border border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 500+ projects by title, description, tags, software..."
                  value={projectSearch}
                  onChange={(e) => {
                    setProjectSearch(e.target.value);
                    setProjectPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-blue-500/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Category filter */}
                <select
                  value={projectCategoryFilter}
                  onChange={(e) => {
                    setProjectCategoryFilter(e.target.value);
                    setProjectPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/20 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="All">All Categories</option>
                  {data.categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                {/* Status filter */}
                <select
                  value={projectStatusFilter}
                  onChange={(e) => {
                    setProjectStatusFilter(e.target.value as any);
                    setProjectPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/20 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published Only</option>
                  <option value="draft">Drafts Only</option>
                </select>

                <div className="text-[11px] font-mono text-cyan-400 px-3 py-2 rounded-xl bg-blue-950/50 border border-blue-500/20 whitespace-nowrap">
                  Showing {paginatedAdminProjects.length} of {filteredAdminProjects.length} ({data.projects.length} Total)
                </div>
              </div>
            </div>

            {/* Projects List */}
            {paginatedAdminProjects.length === 0 ? (
              <div className="text-center py-12 p-6 rounded-2xl bg-[#090f26] border border-blue-500/20">
                <p className="text-slate-400 font-mono text-xs">No projects match the current search or category filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedAdminProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="rounded-2xl overflow-hidden bg-[#090f26] border border-blue-500/20 flex flex-col justify-between"
                  >
                    <div className="aspect-[16/10] bg-slate-950 relative overflow-hidden">
                      <img
                        src={proj.thumbnail || proj.mainImage}
                        alt={proj.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/80 text-cyan-300">
                          {proj.category}
                        </span>
                        {proj.has3DModel && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-600 text-white flex items-center gap-1">
                            <Box className="w-3 h-3" />
                            <span>3D</span>
                          </span>
                        )}
                        {proj.videoUrl && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-600 text-white flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            <span>Video</span>
                          </span>
                        )}
                        {proj.gallery && proj.gallery.length > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-200">
                            +{proj.gallery.length} Gal
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base mb-1 font-display">{proj.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{proj.shortDesc}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => toggleProjectPublished(proj)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium cursor-pointer ${
                            proj.published ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {proj.published ? 'Published' : 'Draft'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewProject(false);
                              setEditingProject(proj);
                            }}
                            className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-cyan-300 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj)}
                            className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 cursor-pointer"
                            title="Delete Project Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls for 500+ Projects */}
            {totalAdminProjectPages > 1 && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#090f26] border border-blue-500/20 text-xs font-mono">
                <span className="text-slate-400">
                  Showing {(projectPage - 1) * PROJECTS_PER_PAGE + 1}–{Math.min(projectPage * PROJECTS_PER_PAGE, filteredAdminProjects.length)} of {filteredAdminProjects.length} projects (Page {projectPage} of {totalAdminProjectPages})
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={projectPage <= 1}
                    onClick={() => setProjectPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold">
                    {projectPage} / {totalAdminProjectPages}
                  </span>
                  <button
                    type="button"
                    disabled={projectPage >= totalAdminProjectPages}
                    onClick={() => setProjectPage((p) => Math.min(totalAdminProjectPages, p + 1))}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Project Edit / Create Modal */}
            {editingProject && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#090f26] border border-blue-500/40 p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                    <h3 className="font-bold text-lg text-white font-display">
                      {isNewProject ? 'Create New Project' : 'Edit Project'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Project Title *</label>
                    <input
                      type="text"
                      required
                      value={editingProject.title || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Category</label>
                      <select
                        value={editingProject.category || '3D Modeling'}
                        onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                      >
                        {data.categories.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Year</label>
                      <input
                        type="text"
                        value={editingProject.year || '2026'}
                        onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Short Description</label>
                    <textarea
                      rows={2}
                      value={editingProject.shortDesc || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, shortDesc: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Full Detailed Description</label>
                    <textarea
                      rows={3}
                      value={editingProject.fullDesc || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, fullDesc: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                    />
                  </div>

                  {/* MAIN / HIGH-RES IMAGE UPLOAD */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-3">
                    <label className="block text-xs font-mono uppercase text-cyan-300 font-semibold">
                      Main / High-Res Project Render (Shown First Look)
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={editingProject.mainImage || ''}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            mainImage: e.target.value,
                            thumbnail: e.target.value,
                            highResImage: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-blue-500/30 text-xs text-white"
                        placeholder="Image URL"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadImage(file, (url) => {
                              setEditingProject({
                                ...editingProject,
                                mainImage: url,
                                thumbnail: url,
                                highResImage: url,
                              });
                            });
                          }
                        }}
                        className="text-xs text-slate-400 file:py-1 file:px-3 file:rounded-lg file:bg-blue-600 file:text-white file:border-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* GALLERY IMAGES */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono uppercase text-cyan-300 font-semibold">
                        Gallery Images ({(editingProject.gallery || []).length})
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadImage(file, (url) => {
                              setEditingProject({
                                ...editingProject,
                                gallery: [...(editingProject.gallery || []), url],
                              });
                            });
                          }
                        }}
                        className="text-xs text-slate-400 file:py-1 file:px-3 file:rounded-lg file:bg-blue-600 file:text-white file:border-0 cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2 overflow-x-auto py-2">
                      {(editingProject.gallery || []).map((img, idx) => (
                        <div key={idx} className="relative w-20 h-16 rounded-lg overflow-hidden border border-slate-700 shrink-0 group">
                          <img src={img} alt="gallery thumb" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProject({
                                ...editingProject,
                                gallery: (editingProject.gallery || []).filter((_, i) => i !== idx),
                              });
                            }}
                            className="absolute top-1 right-1 p-1 rounded bg-rose-900/80 text-white cursor-pointer"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* OPTIONAL 3D MODEL (GLB/GLTF) */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-cyan-300 font-semibold">
                        Optional 3D Model (.glb / .gltf)
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProject.has3DModel)}
                          onChange={(e) => setEditingProject({ ...editingProject, has3DModel: e.target.checked })}
                          className="rounded bg-slate-900 border-blue-500"
                        />
                        <span className="text-white">Enable 3D Model Tab</span>
                      </label>
                    </div>

                    {editingProject.has3DModel && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-mono text-slate-400 mb-1">
                            3D Model File (.glb / .gltf) or Procedural Style
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editingProject.model3DUrl || ''}
                              onChange={(e) => setEditingProject({ ...editingProject, model3DUrl: e.target.value })}
                              placeholder="Upload .glb file or enter model URL"
                              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-blue-500/30 text-xs text-white"
                            />
                            <input
                              type="file"
                              accept=".glb,.gltf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadImage(file, (url) => {
                                    setEditingProject({
                                      ...editingProject,
                                      model3DUrl: url,
                                      model3DType: 'glb-custom',
                                    });
                                  });
                                }
                              }}
                              className="text-xs text-slate-400 file:py-1 file:px-3 file:rounded-lg file:bg-cyan-600 file:text-white file:border-0 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono text-slate-400 mb-1">
                            Procedural Mesh Fallback Style
                          </label>
                          <select
                            value={editingProject.model3DType || 'procedural-mech'}
                            onChange={(e) => setEditingProject({ ...editingProject, model3DType: e.target.value as any })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-500/30 text-xs text-white"
                          >
                            <option value="glb-custom">Custom Uploaded GLB Model</option>
                            <option value="procedural-mech">Robotic Mech Joint Assembly</option>
                            <option value="procedural-torus">Aero Cyber Turbine Knot</option>
                            <option value="procedural-cube">Hard-Surface Tactical Casing</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OPTIONAL PROJECT VIDEO */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-3">
                    <label className="block text-xs font-mono uppercase text-cyan-300 font-semibold">
                      Optional Project Video (.mp4 / .webm)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingProject.videoUrl || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, videoUrl: e.target.value })}
                        placeholder="Video URL or upload MP4"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-blue-500/30 text-xs text-white"
                      />
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadImage(file, (url) => {
                              setEditingProject({ ...editingProject, videoUrl: url });
                            });
                          }
                        }}
                        className="text-xs text-slate-400 file:py-1 file:px-3 file:rounded-lg file:bg-indigo-600 file:text-white file:border-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-blue-900/40">
                    <button
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProject}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer"
                    >
                      Save Project
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB: SKILLS CMS
           ------------------------------------------------------------------- */}
        {activeTab === 'skills' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Technical Skills &amp; Tools CMS</h1>
                <p className="text-xs text-slate-400 font-mono">
                  Manage floating hero skill badges, software proficiencies, and categories.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingSkill({
                    name: '',
                    category: '3d_cad',
                    icon: 'Box',
                    proficiency: 85,
                    isFloatingHero: true,
                    enabled: true,
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Skill</span>
              </button>
            </div>

            <div className="space-y-3">
              {data.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="p-4 rounded-2xl bg-[#090f26] border border-blue-500/20 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                      {skill.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{skill.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                        <span>Proficiency: {skill.proficiency}%</span>
                        <span>·</span>
                        <span className={skill.isFloatingHero ? 'text-cyan-400' : 'text-slate-500'}>
                          {skill.isFloatingHero ? 'Floating on Hero' : 'Standard Skill'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSkill(skill)}
                      className="p-2 rounded-lg bg-blue-950 text-cyan-300 hover:bg-blue-900 cursor-pointer"
                      title="Edit Skill"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(skill)}
                      className="p-2 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 cursor-pointer"
                      title="Delete Skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Skill Modal */}
            {editingSkill && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="w-full max-w-md rounded-2xl bg-[#090f26] border border-blue-500/40 p-6 space-y-4">
                  <h3 className="font-bold text-base text-white font-display">
                    {editingSkill.id ? 'Edit Skill' : 'New Skill'}
                  </h3>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Skill Name</label>
                    <input
                      type="text"
                      required
                      value={editingSkill.name || ''}
                      onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                      placeholder="e.g. SolidWorks"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Proficiency ({editingSkill.proficiency || 80}%)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={editingSkill.proficiency || 80}
                      onChange={(e) => setEditingSkill({ ...editingSkill, proficiency: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={Boolean(editingSkill.isFloatingHero)}
                        onChange={(e) => setEditingSkill({ ...editingSkill, isFloatingHero: e.target.checked })}
                      />
                      <span className="text-white">Float in Hero Section</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingSkill(null)}
                      className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingSkill.name) return;
                        if (editingSkill.id) {
                          await fetch(`/api/skills/${editingSkill.id}`, {
                            method: 'PUT',
                            headers: authHeaders(),
                            body: JSON.stringify(editingSkill),
                          });
                        } else {
                          await fetch('/api/skills', {
                            method: 'POST',
                            headers: authHeaders(),
                            body: JSON.stringify(editingSkill),
                          });
                        }
                        setEditingSkill(null);
                        await onRefreshData();
                        showToast('Skill updated successfully!');
                      }}
                      className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer"
                    >
                      Save Skill
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB: EDUCATION CMS
           ------------------------------------------------------------------- */}
        {activeTab === 'education' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Education Timeline CMS</h1>
                <p className="text-xs text-slate-400 font-mono">
                  Manage academic qualifications (B.Sc., Diploma, SSC) and scores.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingEdu({
                    degree: '',
                    institution: '',
                    year: '2026',
                    result: 'CGPA 3.50 / 4.00',
                    description: '',
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Education Entry</span>
              </button>
            </div>

            <div className="space-y-4">
              {data.education.map((edu) => (
                <div
                  key={edu.id}
                  className="p-5 rounded-2xl bg-[#090f26] border border-blue-500/20 flex items-start justify-between gap-4"
                >
                  <div>
                    <span className="text-xs font-mono text-cyan-400 font-medium block">{edu.year}</span>
                    <h4 className="text-base font-bold text-white font-display mt-0.5">{edu.degree}</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{edu.institution}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-xs">
                      {edu.result}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingEdu(edu)}
                      className="p-2 rounded-lg bg-blue-950 text-cyan-300 hover:bg-blue-900 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(edu)}
                      className="p-2 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 cursor-pointer"
                      title="Delete Education"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Education Modal */}
            {editingEdu && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="w-full max-w-md rounded-2xl bg-[#090f26] border border-blue-500/40 p-6 space-y-4">
                  <h3 className="font-bold text-base text-white font-display">
                    {editingEdu.id ? 'Edit Education' : 'Add Education'}
                  </h3>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Degree Title</label>
                    <input
                      type="text"
                      value={editingEdu.degree || ''}
                      onChange={(e) => setEditingEdu({ ...editingEdu, degree: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Institution</label>
                    <input
                      type="text"
                      value={editingEdu.institution || ''}
                      onChange={(e) => setEditingEdu({ ...editingEdu, institution: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Year / Timeline</label>
                      <input
                        type="text"
                        value={editingEdu.year || ''}
                        onChange={(e) => setEditingEdu({ ...editingEdu, year: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1">GPA / CGPA Result</label>
                      <input
                        type="text"
                        value={editingEdu.result || ''}
                        onChange={(e) => setEditingEdu({ ...editingEdu, result: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingEdu(null)}
                      className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingEdu.degree) return;
                        if (editingEdu.id) {
                          await fetch(`/api/education/${editingEdu.id}`, {
                            method: 'PUT',
                            headers: authHeaders(),
                            body: JSON.stringify(editingEdu),
                          });
                        } else {
                          await fetch('/api/education', {
                            method: 'POST',
                            headers: authHeaders(),
                            body: JSON.stringify(editingEdu),
                          });
                        }
                        setEditingEdu(null);
                        await onRefreshData();
                        showToast('Education updated');
                      }}
                      className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer"
                    >
                      Save Education
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB: ACHIEVEMENTS & AWARDS CMS (WITH CERTIFICATE IMAGE UPLOAD & REORDER)
           ------------------------------------------------------------------- */}
        {activeTab === 'achievements' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Achievements &amp; Awards CMS</h1>
                <p className="text-xs text-slate-400 font-mono">
                  Manage awards, Olympiad recognitions, certificate image uploads, icons, reordering, and publishing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAch({
                    title: '',
                    subtitle: '',
                    organization: '',
                    year: String(new Date().getFullYear()),
                    description: '',
                    icon: 'Trophy',
                    image: '',
                    certificateImage: '',
                    externalLink: '',
                    published: true,
                    order: data.achievements.length + 1,
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-semibold text-xs text-white shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Achievement</span>
              </button>
            </div>

            <div className="space-y-4">
              {[...data.achievements]
                .sort((a, b) => a.order - b.order)
                .map((ach, idx, arr) => {
                  const certImg = ach.image || ach.certificateImage;
                  return (
                    <div
                      key={ach.id}
                      className="p-5 rounded-2xl bg-[#090f26] border border-blue-500/20 hover:border-blue-500/40 transition-colors flex flex-col sm:flex-row items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        {/* Order Number Badge */}
                        <div className="shrink-0 flex flex-col items-center gap-1">
                          <span className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-500/30 flex items-center justify-center text-xs font-mono font-bold text-cyan-400">
                            #{idx + 1}
                          </span>
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5 mt-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveAchievement(idx, 'up')}
                              className="p-1 rounded bg-blue-950/80 hover:bg-blue-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === arr.length - 1}
                              onClick={() => handleMoveAchievement(idx, 'down')}
                              className="p-1 rounded bg-blue-950/80 hover:bg-blue-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Certificate Image Thumbnail */}
                        {certImg ? (
                          <div className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden border border-blue-500/30 shrink-0 bg-slate-950">
                            <img
                              src={certImg}
                              alt={ach.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl border border-dashed border-blue-500/30 shrink-0 bg-slate-950 flex flex-col items-center justify-center text-slate-500 text-[10px]">
                            <Trophy className="w-4 h-4 mb-1 text-slate-600" />
                            <span>No Image</span>
                          </div>
                        )}

                        {/* Achievement Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-xs font-mono font-bold text-amber-400">
                              {ach.year}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-mono">
                              {ach.icon || 'Trophy'}
                            </span>
                            {ach.published !== false ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-mono text-emerald-400">
                                Published
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-400">
                                Draft / Unpublished
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-bold text-white font-display truncate">
                            {ach.title}
                          </h4>

                          {ach.subtitle && (
                            <p className="text-xs font-medium text-slate-300 mt-0.5">
                              {ach.subtitle}
                            </p>
                          )}

                          {ach.organization && (
                            <p className="text-xs font-mono text-cyan-400 mt-0.5">
                              {ach.organization}
                            </p>
                          )}

                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 max-w-xl">
                            {ach.description}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePublishAchievement(ach)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            ach.published !== false
                              ? 'bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                          }`}
                          title="Toggle publish status"
                        >
                          {ach.published !== false ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAch(ach)}
                          className="p-2 rounded-lg bg-blue-950 text-cyan-300 hover:bg-blue-900 cursor-pointer transition-colors"
                          title="Edit Achievement"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAchievement(ach)}
                          className="p-2 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 cursor-pointer transition-colors"
                          title="Delete Achievement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Achievement Edit / Add Modal */}
            {editingAch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                <div className="w-full max-w-lg rounded-2xl bg-[#090f26] border border-blue-500/40 p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                    <h3 className="font-bold text-base text-white font-display">
                      {editingAch.id ? 'Edit Achievement' : 'New Achievement'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingAch(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Award / Achievement Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingAch.title || ''}
                      onChange={(e) => setEditingAch({ ...editingAch, title: e.target.value })}
                      placeholder="e.g. SSR Cultural Award"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Subtitle / Short Tagline
                    </label>
                    <input
                      type="text"
                      value={editingAch.subtitle || ''}
                      onChange={(e) => setEditingAch({ ...editingAch, subtitle: e.target.value })}
                      placeholder="e.g. Cultural &amp; Technical Leadership Recognition"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Organization */}
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                        Organization / Issuing Body
                      </label>
                      <input
                        type="text"
                        value={editingAch.organization || ''}
                        onChange={(e) => setEditingAch({ ...editingAch, organization: e.target.value })}
                        placeholder="e.g. SSR Institute of Technology"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white focus:border-cyan-400 outline-none"
                      />
                    </div>

                    {/* Year */}
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                        Year *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingAch.year || ''}
                        onChange={(e) => setEditingAch({ ...editingAch, year: e.target.value })}
                        placeholder="e.g. 2024"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white focus:border-cyan-400 outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Icon Selector */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Achievement Icon
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {[
                        { id: 'Trophy', label: 'Trophy', icon: Trophy },
                        { id: 'Award', label: 'Award', icon: Award },
                        { id: 'Medal', label: 'Medal', icon: Medal },
                        { id: 'Star', label: 'Star', icon: Star },
                        { id: 'Sparkles', label: 'Sparkles', icon: Sparkles },
                        { id: 'Crown', label: 'Crown', icon: Crown },
                        { id: 'CheckCircle2', label: 'Certified', icon: CheckCircle2 },
                      ].map((ic) => {
                        const IconComp = ic.icon;
                        const isSelected = (editingAch.icon || 'Trophy') === ic.id;
                        return (
                          <button
                            key={ic.id}
                            type="button"
                            onClick={() => setEditingAch({ ...editingAch, icon: ic.id })}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-950/70 border-amber-400 text-amber-300'
                                : 'bg-slate-950 border-blue-500/20 text-slate-400 hover:text-white hover:border-blue-500/40'
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                            <span className="text-[10px] truncate max-w-full">{ic.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Certificate / Award Image Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono uppercase text-slate-300">
                      Certificate / Award Image (Displayed at Top of Card)
                    </label>

                    {(editingAch.image || editingAch.certificateImage) && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-blue-500/30 bg-slate-950">
                        <img
                          src={editingAch.image || editingAch.certificateImage}
                          alt="Certificate preview"
                          className="w-full h-full object-contain bg-slate-950"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingAch({ ...editingAch, image: '', certificateImage: '' })}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 cursor-pointer"
                          title="Remove Image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <input
                        type="text"
                        value={editingAch.image || editingAch.certificateImage || ''}
                        onChange={(e) =>
                          setEditingAch({
                            ...editingAch,
                            image: e.target.value,
                            certificateImage: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                        placeholder="Image URL or upload file below"
                      />
                      <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs text-white cursor-pointer font-medium shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadImage(file, (url) => {
                                setEditingAch({
                                  ...editingAch,
                                  image: url,
                                  certificateImage: url,
                                });
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Full Description
                    </label>
                    <textarea
                      rows={3}
                      value={editingAch.description || ''}
                      onChange={(e) => setEditingAch({ ...editingAch, description: e.target.value })}
                      placeholder="Detailed background or impact of the achievement..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white focus:border-cyan-400 outline-none"
                    />
                  </div>

                  {/* External Link */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      External Verification Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={editingAch.externalLink || ''}
                      onChange={(e) => setEditingAch({ ...editingAch, externalLink: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-xs text-white"
                      placeholder="https://example.com/certificate-verify"
                    />
                  </div>

                  {/* Published Checkbox */}
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={editingAch.published !== false}
                        onChange={(e) => setEditingAch({ ...editingAch, published: e.target.checked })}
                        className="rounded border-blue-500/40 text-blue-600 focus:ring-0"
                      />
                      <span>Publish on live portfolio website</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingAch(null)}
                      className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingAch.title?.trim()) {
                          showToast('Achievement title is required', 'error');
                          return;
                        }
                        try {
                          const payload = {
                            ...editingAch,
                            title: editingAch.title.trim(),
                            subtitle: editingAch.subtitle?.trim() || '',
                            organization: editingAch.organization?.trim() || '',
                            year: editingAch.year?.trim() || String(new Date().getFullYear()),
                            description: editingAch.description?.trim() || editingAch.subtitle || '',
                            icon: editingAch.icon || 'Trophy',
                            image: editingAch.image || editingAch.certificateImage || '',
                            certificateImage: editingAch.image || editingAch.certificateImage || '',
                            externalLink: editingAch.externalLink?.trim() || '',
                            published: editingAch.published !== false,
                          };

                          if (editingAch.id) {
                            const res = await fetch(`/api/achievements/${editingAch.id}`, {
                              method: 'PUT',
                              headers: authHeaders(),
                              body: JSON.stringify(payload),
                            });
                            if (!res.ok) throw new Error('Failed to update achievement');
                          } else {
                            const res = await fetch('/api/achievements', {
                              method: 'POST',
                              headers: authHeaders(),
                              body: JSON.stringify(payload),
                            });
                            if (!res.ok) throw new Error('Failed to create achievement');
                          }
                          setEditingAch(null);
                          await onRefreshData();
                          showToast('Achievement saved successfully');
                        } catch (err: any) {
                          showToast(err.message || 'Failed to save achievement', 'error');
                        }
                      }}
                      className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl cursor-pointer shadow-lg"
                    >
                      Save Achievement
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB: CONTACT MESSAGES (WITH WORKING DELETE & DIRECT VISITOR CONTACT)
           ------------------------------------------------------------------- */}
        {activeTab === 'messages' && (
          <div className="max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Client Inquiries &amp; Messages</h1>
                <p className="text-xs text-slate-400 font-mono">
                  Messages submitted by visitors through the contact section form.
                </p>
              </div>
              <button
                type="button"
                onClick={loadMessages}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-blue-500/20 text-xs font-mono text-cyan-400 hover:text-white cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {messages.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#090f26] border border-blue-500/20 text-slate-400 font-mono text-sm">
                No contact submissions found.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  // Direct WhatsApp contact to SUBMITTER'S number:
                  const submitterCleanPhone = (msg.phone || '').replace(/[^0-9]/g, '');

                  return (
                    <div
                      key={msg.id}
                      className={`p-6 rounded-3xl border transition-all ${
                        msg.read
                          ? 'bg-[#090f26]/60 border-blue-900/30 opacity-80'
                          : 'bg-[#0a1233] border-cyan-500/40 shadow-xl shadow-cyan-950/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white font-display">{msg.name}</h4>
                            {!msg.read && (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-600 text-white text-[10px] font-mono font-bold">
                                UNREAD
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-300 mt-1">
                            <a href={`mailto:${msg.email}`} className="text-cyan-400 hover:underline">
                              {msg.email}
                            </a>
                            {msg.phone && <span>· Tel: {msg.phone}</span>}
                            {msg.address && <span>· Loc: {msg.address}</span>}
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed mb-4 whitespace-pre-wrap">
                        {msg.message}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 flex-wrap gap-2">
                        {/* Requirement 26: DIRECT CONTACT BUTTONS TO VISITOR */}
                        <div className="flex items-center gap-2">
                          <a
                            href={`mailto:${msg.email}?subject=Re:%203D%20Project%20Inquiry%20-%20MD%20Nayem%20Hossain`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Email Submitter</span>
                          </a>

                          {submitterCleanPhone ? (
                            <a
                              href={`https://wa.me/${submitterCleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp ({msg.phone})</span>
                            </a>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-500">
                              (No phone provided)
                            </span>
                          )}
                        </div>

                        {/* Actions: Mark read/unread & Delete */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleMessageRead(msg.id, msg.read)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-[11px] cursor-pointer"
                          >
                            {msg.read ? 'Mark as Unread' : 'Mark as Read'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg)}
                            className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 cursor-pointer"
                            title="Delete Message Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB: CATEGORIES CMS
           ------------------------------------------------------------------- */}
        {activeTab === 'categories' && (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Project Categories</h1>
                <p className="text-xs text-slate-400 font-mono">
                  Manage categories displayed in the project portfolio filter tabs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCat({ name: '' })}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="space-y-3">
              {data.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl bg-[#090f26] border border-blue-500/20 flex items-center justify-between"
                >
                  <span className="font-semibold text-white text-sm">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCat(cat)}
                      className="p-2 rounded-lg bg-blue-950 text-cyan-300 hover:bg-blue-900 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-2 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Category Modal */}
            {editingCat && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="w-full max-w-sm rounded-2xl bg-[#090f26] border border-blue-500/40 p-5 space-y-4">
                  <h3 className="font-bold text-sm text-white font-display">
                    {editingCat.id ? 'Edit Category' : 'New Category'}
                  </h3>
                  <input
                    type="text"
                    required
                    value={editingCat.name}
                    onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                    placeholder="e.g. Hard Surface Modeling"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCat(null)}
                      className="px-3 py-1.5 text-xs text-slate-400 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingCat.name.trim()) return;
                        if (editingCat.id) {
                          await fetch(`/api/categories/${editingCat.id}`, {
                            method: 'PUT',
                            headers: authHeaders(),
                            body: JSON.stringify({ name: editingCat.name.trim() }),
                          });
                        } else {
                          await fetch('/api/categories', {
                            method: 'POST',
                            headers: authHeaders(),
                            body: JSON.stringify({ name: editingCat.name.trim() }),
                          });
                        }
                        setEditingCat(null);
                        await onRefreshData();
                        showToast('Category updated');
                      }}
                      className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-xl cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB: SOCIALS CMS
           ------------------------------------------------------------------- */}
        {activeTab === 'socials' && (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Social Links CMS</h1>
                <p className="text-xs text-slate-400 font-mono">
                  LinkedIn, WhatsApp, ArtStation, Behance, Facebook links in footer and contact.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSoc({ platform: 'Platform', url: 'https://', icon: 'Globe', enabled: true })}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Social Link</span>
              </button>
            </div>

            <div className="space-y-3">
              {data.socials.map((soc) => (
                <div
                  key={soc.id}
                  className="p-4 rounded-2xl bg-[#090f26] border border-blue-500/20 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-bold text-white text-sm block">{soc.platform}</span>
                    <span className="text-xs font-mono text-cyan-400">{soc.url}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSoc(soc)}
                      className="p-2 rounded-lg bg-blue-950 text-cyan-300 hover:bg-blue-900 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSocial(soc)}
                      className="p-2 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 cursor-pointer"
                      title="Delete Social Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Link Modal */}
            {editingSoc && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="w-full max-w-sm rounded-2xl bg-[#090f26] border border-blue-500/40 p-5 space-y-4">
                  <h3 className="font-bold text-sm text-white font-display">
                    {editingSoc.id ? 'Edit Social Link' : 'New Social Link'}
                  </h3>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Platform Name</label>
                    <input
                      type="text"
                      value={editingSoc.platform || ''}
                      onChange={(e) => setEditingSoc({ ...editingSoc, platform: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Target URL</label>
                    <input
                      type="text"
                      value={editingSoc.url || ''}
                      onChange={(e) => setEditingSoc({ ...editingSoc, url: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSoc(null)}
                      className="px-3 py-1.5 text-xs text-slate-400 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingSoc.platform) return;
                        if (editingSoc.id) {
                          await fetch(`/api/socials/${editingSoc.id}`, {
                            method: 'PUT',
                            headers: authHeaders(),
                            body: JSON.stringify(editingSoc),
                          });
                        } else {
                          await fetch('/api/socials', {
                            method: 'POST',
                            headers: authHeaders(),
                            body: JSON.stringify(editingSoc),
                          });
                        }
                        setEditingSoc(null);
                        await onRefreshData();
                        showToast('Social link saved');
                      }}
                      className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-xl cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB: NAVIGATION & FOOTER CMS
           ------------------------------------------------------------------- */}
        {activeTab === 'nav_footer' && (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Nav &amp; Footer CMS</h1>
                <p className="text-xs text-slate-400 font-mono">
                  Customize navbar brand labels, WhatsApp Hire Me CTA destination, and footer tagline.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveNavFooter}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Nav &amp; Footer</span>
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-[#090f26] border border-blue-500/20 space-y-5">
              <h3 className="text-sm font-mono uppercase text-cyan-400">Navbar Settings</h3>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Hire Me Button Text
                </label>
                <input
                  type="text"
                  value={data.navigation.hireMeText}
                  onChange={(e) =>
                    setData({
                      ...data,
                      navigation: { ...data.navigation, hireMeText: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Hire Me Button Destination (WhatsApp URL)
                </label>
                <input
                  type="text"
                  value={data.navigation.hireMeHref}
                  onChange={(e) =>
                    setData({
                      ...data,
                      navigation: { ...data.navigation, hireMeHref: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                />
              </div>

              <div className="pt-4 border-t border-blue-900/40">
                <h3 className="text-sm font-mono uppercase text-cyan-400 mb-3">Footer Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Footer Brand Name (Displayed Alone Without Logo)
                    </label>
                    <input
                      type="text"
                      value={data.footer.brandName}
                      onChange={(e) => setData({ ...data, footer: { ...data.footer, brandName: e.target.value } })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Footer Tagline
                    </label>
                    <input
                      type="text"
                      value={data.footer.tagline}
                      onChange={(e) => setData({ ...data, footer: { ...data.footer, tagline: e.target.value } })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            TAB: SETTINGS & SEO
           ------------------------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Settings &amp; SEO</h1>
                <p className="text-xs text-slate-400 font-mono">
                  Site metadata, contact credentials, and admin security password.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Site Settings</span>
              </button>
            </div>

            {/* General & Contact Settings */}
            <div className="p-6 rounded-3xl bg-[#090f26] border border-blue-500/20 space-y-4">
              <h3 className="text-sm font-mono uppercase text-cyan-400">Contact Information Settings</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={data.settings.contactEmail}
                    onChange={(e) => setData({ ...data, settings: { ...data.settings, contactEmail: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={data.settings.contactPhone}
                    onChange={(e) => setData({ ...data, settings: { ...data.settings, contactPhone: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={data.settings.contactWhatsapp}
                    onChange={(e) => setData({ ...data, settings: { ...data.settings, contactWhatsapp: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Location / Address</label>
                  <input
                    type="text"
                    value={data.settings.contactLocation}
                    onChange={(e) => setData({ ...data, settings: { ...data.settings, contactLocation: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                  />
                </div>
              </div>
            </div>

            {/* SEO Settings */}
            <div className="p-6 rounded-3xl bg-[#090f26] border border-blue-500/20 space-y-4">
              <h3 className="text-sm font-mono uppercase text-cyan-400">SEO &amp; Meta Tags</h3>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Site Title Tag</label>
                <input
                  type="text"
                  value={data.settings.siteTitle}
                  onChange={(e) => setData({ ...data, settings: { ...data.settings, siteTitle: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  value={data.settings.metaDescription}
                  onChange={(e) => setData({ ...data, settings: { ...data.settings, metaDescription: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white"
                />
              </div>
            </div>

            {/* Change Admin Password */}
            <div className="p-6 rounded-3xl bg-[#090f26] border border-blue-500/20 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>Change Admin Password</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Update your admin login credentials. Persisted securely in the database.
                </p>
              </div>

              {passError && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={passData.currentPassword}
                      onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                      placeholder="......"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passData.newPassword}
                      onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                      placeholder="......"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passData.confirmPassword}
                      onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                      placeholder="......"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono tracking-widest"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-semibold text-xs text-white shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isChangingPass ? 'Updating Password...' : 'Change Admin Password'}</span>
                  </button>

                  <span className="text-[11px] font-mono text-slate-400">
                    Minimum 6 characters · Secure PBKDF2 Hashing
                  </span>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
