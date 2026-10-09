import { Router, type Request, type Response } from 'express';
import {
  initStorage,
  getStorageMode,
  getUnifiedSiteData,
  getProjects,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  reorderAchievements,
  getMessages,
  createMessage,
  markMessageRead,
  deleteMessage,
  updateSettings,
  updateHero,
  updateAbout,
  updateNavigation,
  updateFooter,
  getSocials,
  createSocial,
  updateSocial,
  deleteSocial,
  getAdminAccount,
  updateAdminCredentials,
} from './db/storage.ts';
import {
  verifyPassword,
  hashPassword,
  createToken,
  requireAuth,
  verifyToken,
  loginRateLimiter,
  contactRateLimiter,
  uploadRateLimiter,
  type AuthenticatedRequest,
} from './auth.ts';
import { uploadMediaFile, getMediaStorageInfo } from './media/uploader.ts';
import { isMongoActive, getMongoConnectionState } from './db/mongo.ts';
import type { ProjectItem, SkillItem, EducationItem, AchievementItem, SocialLink, SoftSkillItem } from './types.ts';

const api = Router();

// Ensure storage is initialized
initStorage().catch(err => {
  console.error('Storage initialization error:', err);
});

/* ==========================================================================
   SYSTEM HEALTH & DIAGNOSTICS
   ========================================================================== */
api.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      mode: getStorageMode(),
      mongoConnected: isMongoActive(),
      connectionState: getMongoConnectionState().status,
    },
    mediaStorage: getMediaStorageInfo().provider,
  });
});

api.get('/admin/system-status', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  const allProjects = await getAllProjects(true);
  const messages = await getMessages();
  res.json({
    timestamp: new Date().toISOString(),
    database: {
      mode: getStorageMode(),
      mongoConnected: isMongoActive(),
      connectionState: getMongoConnectionState().status,
    },
    mediaStorage: getMediaStorageInfo(),
    counts: {
      totalProjects: allProjects.length,
      publishedProjects: allProjects.filter(p => p.published).length,
      totalMessages: messages.length,
      unreadMessages: messages.filter(m => !m.read).length,
    },
  });
});

/* ==========================================================================
   PUBLIC SITE DATA (Unified visitor & admin initial load)
   ========================================================================== */
api.get('/site-data', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const isAdmin = Boolean(authHeader?.startsWith('Bearer ') && verifyToken(authHeader.substring(7)));
    const siteData = await getUnifiedSiteData(isAdmin);
    res.json(siteData);
  } catch (err: any) {
    console.error('Error fetching site-data:', err);
    res.status(500).json({ error: 'Failed to retrieve site data' });
  }
});

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */
api.post('/auth/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await getAdminAccount();
    if (!admin || admin.username !== username) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = verifyPassword(password, admin.passwordHash, admin.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = createToken({ id: admin.id, username: admin.username });
    res.json({
      token,
      user: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication service encountered an error' });
  }
});

api.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = await getAdminAccount();
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    res.json({
      user: {
        id: admin.id,
        username: admin.username,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (err: any) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

api.post('/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirm password do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const admin = await getAdminAccount();
    if (!admin) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    const isValid = verifyPassword(currentPassword, admin.passwordHash, admin.salt);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const { hash, salt } = hashPassword(newPassword);
    await updateAdminCredentials(hash, salt);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/* ==========================================================================
   ADMIN STATS & OVERVIEW
   ========================================================================== */
api.get('/admin/overview', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [allProjects, messages, skills, achievements] = await Promise.all([
      getAllProjects(true),
      getMessages(),
      getSkills(),
      getAchievements(true),
    ]);

    res.json({
      stats: {
        totalProjects: allProjects.length,
        publishedProjects: allProjects.filter(p => p.published).length,
        totalMessages: messages.length,
        unreadMessages: messages.filter(m => !m.read).length,
        totalSkills: skills.length,
        totalAchievements: achievements.length,
      },
      recentMessages: messages.slice(0, 5),
      featuredProjects: allProjects.filter(p => p.featured),
    });
  } catch (err: any) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to retrieve overview statistics' });
  }
});

/* ==========================================================================
   PROJECTS CRUD & PAGINATION (Supports 500+ Projects)
   ========================================================================== */
api.get('/projects', async (req: Request, res: Response) => {
  try {
    const isAll = req.query.all === 'true';
    const hasPaginationQuery = req.query.page !== undefined || req.query.paginated === 'true';

    if (hasPaginationQuery) {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const featured = req.query.featured === 'true';

      const result = await getProjects({
        page,
        limit,
        category,
        search,
        featured,
        publishedOnly: !isAll,
      });
      return res.json(result);
    }

    // Default backward compatible unpaginated array
    const projects = await getAllProjects(isAll);
    res.json(projects);
  } catch (err: any) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Failed to retrieve projects' });
  }
});

api.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err: any) {
    console.error('Get project by id error:', err);
    res.status(500).json({ error: 'Failed to retrieve project' });
  }
});

api.post('/projects', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newProject = await createProject(req.body);
    res.status(201).json(newProject);
  } catch (err: any) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

api.put('/projects/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateProject(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json(updated);
  } catch (err: any) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

api.delete('/projects/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await deleteProject(req.params.id);
    if (!success) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true, message: 'Project deleted permanently' });
  } catch (err: any) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

/* ==========================================================================
   CATEGORIES CRUD
   ========================================================================== */
api.get('/categories', async (_req: Request, res: Response) => {
  try {
    const cats = await getCategories();
    res.json(cats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

api.post('/categories', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const newCat = await createCategory(name);
    res.status(201).json(newCat);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

api.put('/categories/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateCategory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

api.delete('/categories/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await deleteCategory(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

/* ==========================================================================
   SKILLS CRUD
   ========================================================================== */
api.get('/skills', async (_req: Request, res: Response) => {
  try {
    const skills = await getSkills();
    res.json(skills);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve skills' });
  }
});

api.post('/skills', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const skill = await createSkill(req.body);
    res.status(201).json(skill);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

api.put('/skills/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateSkill(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Skill not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

api.delete('/skills/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await deleteSkill(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Skill not found' });
    res.json({ success: true, message: 'Skill deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

/* ==========================================================================
   EDUCATION CRUD
   ========================================================================== */
api.get('/education', async (_req: Request, res: Response) => {
  try {
    const edu = await getEducation();
    res.json(edu);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve education' });
  }
});

api.post('/education', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const edu = await createEducation(req.body);
    res.status(201).json(edu);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create education entry' });
  }
});

api.put('/education/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateEducation(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Education entry not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update education entry' });
  }
});

api.delete('/education/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await deleteEducation(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Education entry not found' });
    res.json({ success: true, message: 'Education entry deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete education entry' });
  }
});

/* ==========================================================================
   ACHIEVEMENTS CRUD
   ========================================================================== */
api.get('/achievements', async (req: Request, res: Response) => {
  try {
    const isAll = req.query.all === 'true';
    const list = await getAchievements(isAll);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve achievements' });
  }
});

api.post('/achievements', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ach = await createAchievement(req.body);
    res.status(201).json(ach);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create achievement' });
  }
});

api.put('/achievements/reorder', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderList } = req.body;
    if (!Array.isArray(orderList)) {
      return res.status(400).json({ error: 'orderList must be an array of { id, order }' });
    }
    const updated = await reorderAchievements(orderList);
    res.json({ success: true, achievements: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reorder achievements' });
  }
});

api.put('/achievements/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateAchievement(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Achievement not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update achievement' });
  }
});

api.delete('/achievements/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await deleteAchievement(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Achievement not found' });
    res.json({ success: true, message: 'Achievement deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete achievement' });
  }
});

/* ==========================================================================
   CONTACT MESSAGES
   ========================================================================== */
api.post('/messages', contactRateLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    await createMessage({ name, email, phone, address, message });
    res.status(201).json({ success: true, message: 'Thank you! Your inquiry has been sent successfully.' });
  } catch (err: any) {
    console.error('Contact message error:', err);
    res.status(500).json({ error: 'Failed to submit contact message' });
  }
});

api.get('/messages', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const msgs = await getMessages();
    res.json(msgs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

api.put('/messages/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isRead = typeof req.body.read === 'boolean' ? req.body.read : true;
    const msg = await markMessageRead(req.params.id, isRead);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json(msg);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

api.delete('/messages/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await deleteMessage(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

/* ==========================================================================
   CMS SECTIONS (Hero, About, Settings, Socials, Navigation, Footer)
   ========================================================================== */
api.put('/hero', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateHero(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update hero data' });
  }
});

api.put('/about', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateAbout(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update about data' });
  }
});

api.put('/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

api.put('/navigation', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateNavigation(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update navigation' });
  }
});

api.put('/footer', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateFooter(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update footer' });
  }
});

api.get('/socials', async (_req: Request, res: Response) => {
  try {
    const socials = await getSocials();
    res.json(socials);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve social links' });
  }
});

api.post('/socials', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newSoc = await createSocial(req.body);
    res.status(201).json(newSoc);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create social link' });
  }
});

api.put('/socials/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await updateSocial(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Social link not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update social link' });
  }
});

api.delete('/socials/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await deleteSocial(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Social link not found' });
    res.json({ success: true, message: 'Social link deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete social link' });
  }
});

/* ==========================================================================
   MEDIA UPLOAD (Cloudinary / Local with MIME & Extension Whitelist)
   ========================================================================== */
api.post('/upload', requireAuth, uploadRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'dataUrl base64 string is required' });
    }

    const uploadResult = await uploadMediaFile(dataUrl, filename);
    res.json(uploadResult);
  } catch (err: any) {
    console.error('Upload processing error:', err.message);
    res.status(400).json({ error: err.message || 'Failed to process file upload' });
  }
});

export default api;
