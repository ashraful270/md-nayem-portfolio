import { config } from '../config.ts';
import {
  isMongoActive,
  connectMongo,
  AdminModel,
  ProjectModel,
  CategoryModel,
  AchievementModel,
  SkillModel,
  EducationModel,
  ContactMessageModel,
  SocialLinkModel,
  SettingsModel,
  HeroModel,
  AboutModel,
  NavigationModel,
  FooterModel,
} from './mongo.ts';
import { getDatabase as getLocalDb, saveDatabase as saveLocalDb } from './db-local.ts';
import type {
  AdminUser,
  SiteSettings,
  HeroData,
  AboutData,
  EducationItem,
  SkillItem,
  ProjectItem,
  CategoryItem,
  AchievementItem,
  ContactMessage,
  SocialLink,
  NavigationItem,
  FooterData,
  SoftSkillItem,
  DatabaseSchema,
} from '../types.ts';

export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  featured?: boolean;
  publishedOnly?: boolean;
}

export interface PaginatedProjects {
  projects: ProjectItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

/* ==========================================================================
   INITIALIZATION & STATUS
   ========================================================================== */
let mongoInitAttempted = false;

export async function initStorage(): Promise<void> {
  if (mongoInitAttempted) return;
  mongoInitAttempted = true;

  if (config.mongoUri) {
    console.log('🔄 [DATABASE] Connecting to MongoDB Atlas...');
    const connected = await connectMongo(config.mongoUri);
    if (!connected) {
      if (config.isProduction) {
        console.error('🚨 [CRITICAL] MongoDB Atlas connection failed in production mode.');
      } else {
        console.warn('⚠️ [DATABASE] MongoDB connection failed in development; using local JSON fallback.');
      }
    }
  } else {
    if (config.isProduction) {
      console.warn('⚠️ [CONFIG] MONGODB_URI is not set in production. Please configure MONGODB_URI for persistent database storage.');
    } else {
      console.log('📁 [STORAGE] Using local file-backed JSON database (data/db.json) in development mode.');
    }
  }
}

export function getStorageMode(): 'mongodb' | 'local_json' {
  return isMongoActive() ? 'mongodb' : 'local_json';
}

/* ==========================================================================
   SITE DATA (Unified Visitor & Admin payload)
   ========================================================================== */
export async function getUnifiedSiteData(isAdmin: boolean = false): Promise<{
  settings: SiteSettings;
  hero: HeroData;
  about: AboutData;
  education: EducationItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  categories: CategoryItem[];
  achievements: AchievementItem[];
  socials: SocialLink[];
  navigation: { items: NavigationItem[]; hireMeText: string; hireMeHref: string };
  footer: FooterData;
}> {
  if (isMongoActive()) {
    try {
      const [
        settingsDoc,
        heroDoc,
        aboutDoc,
        educationDocs,
        skillDocs,
        projectDocs,
        categoryDocs,
        achievementDocs,
        socialDocs,
        navDoc,
        footerDoc,
      ] = await Promise.all([
        SettingsModel.findOne().lean<SiteSettings>(),
        HeroModel.findOne().lean<HeroData>(),
        AboutModel.findOne().lean<AboutData>(),
        EducationModel.find().sort({ order: 1 }).lean<EducationItem[]>(),
        SkillModel.find(isAdmin ? {} : { enabled: true }).sort({ order: 1 }).lean<SkillItem[]>(),
        ProjectModel.find(isAdmin ? {} : { published: true }).sort({ order: 1 }).lean<ProjectItem[]>(),
        CategoryModel.find().lean<CategoryItem[]>(),
        AchievementModel.find(isAdmin ? {} : { published: true }).sort({ order: 1 }).lean<AchievementItem[]>(),
        SocialLinkModel.find(isAdmin ? {} : { enabled: true }).sort({ order: 1 }).lean<SocialLink[]>(),
        NavigationModel.findOne().lean<{ items: NavigationItem[]; hireMeText: string; hireMeHref: string }>(),
        FooterModel.findOne().lean<FooterData>(),
      ]);

      const local = getLocalDb();

      return {
        settings: settingsDoc || local.settings,
        hero: heroDoc || local.hero,
        about: aboutDoc || local.about,
        education: educationDocs?.length ? educationDocs : local.education,
        skills: skillDocs?.length ? skillDocs : (isAdmin ? local.skills : local.skills.filter(s => s.enabled)),
        projects: projectDocs?.length ? projectDocs : (isAdmin ? local.projects : local.projects.filter(p => p.published)),
        categories: categoryDocs?.length ? categoryDocs : local.categories,
        achievements: achievementDocs?.length ? achievementDocs : (isAdmin ? local.achievements : local.achievements.filter(a => a.published)),
        socials: socialDocs?.length ? socialDocs : (isAdmin ? local.socials : local.socials.filter(s => s.enabled)),
        navigation: navDoc || local.navigation,
        footer: footerDoc || local.footer,
      };
    } catch (err: any) {
      console.error('Error fetching site data from MongoDB:', err.message);
      if (config.isProduction) throw err;
    }
  }

  // Local fallback
  const db = getLocalDb();
  return {
    settings: db.settings,
    hero: db.hero,
    about: {
      ...db.about,
      softSkills: (db.about.softSkills || []).sort((a, b) => a.order - b.order),
    },
    education: db.education.sort((a, b) => a.order - b.order),
    skills: (isAdmin ? db.skills : db.skills.filter(s => s.enabled)).sort((a, b) => a.order - b.order),
    projects: (isAdmin ? db.projects : db.projects.filter(p => p.published)).sort((a, b) => a.order - b.order),
    categories: db.categories,
    achievements: (isAdmin ? db.achievements : db.achievements.filter(a => a.published)).sort((a, b) => a.order - b.order),
    socials: (isAdmin ? db.socials : db.socials.filter(s => s.enabled)).sort((a, b) => a.order - b.order),
    navigation: db.navigation,
    footer: db.footer,
  };
}

/* ==========================================================================
   PROJECTS CRUD & PAGINATION (500+ Items support)
   ========================================================================== */
export async function getProjects(params: ProjectQueryParams = {}): Promise<PaginatedProjects> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 20));
  const skip = (page - 1) * limit;

  if (isMongoActive()) {
    const query: any = {};
    if (params.publishedOnly !== false) {
      query.published = true;
    }
    if (params.category && params.category !== 'All') {
      query.category = { $regex: new RegExp(`^${params.category}$`, 'i') };
    }
    if (params.featured) {
      query.featured = true;
    }
    if (params.search) {
      const s = params.search.trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { shortDesc: { $regex: s, $options: 'i' } },
        { tags: { $in: [new RegExp(s, 'i')] } },
        { software: { $in: [new RegExp(s, 'i')] } },
      ];
    }

    const [total, projects] = await Promise.all([
      ProjectModel.countDocuments(query),
      ProjectModel.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<ProjectItem[]>(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      projects,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  // Local fallback
  const db = getLocalDb();
  let list = db.projects;
  if (params.publishedOnly !== false) {
    list = list.filter(p => p.published);
  }
  if (params.category && params.category !== 'All') {
    list = list.filter(p => p.category.toLowerCase() === params.category!.toLowerCase());
  }
  if (params.featured) {
    list = list.filter(p => p.featured);
  }
  if (params.search) {
    const s = params.search.toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(s) ||
      p.shortDesc.toLowerCase().includes(s) ||
      p.tags.some(t => t.toLowerCase().includes(s)) ||
      p.software.some(sw => sw.toLowerCase().includes(s))
    );
  }

  list = [...list].sort((a, b) => a.order - b.order);
  const total = list.length;
  const paginated = list.slice(skip, skip + limit);
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    projects: paginated,
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}

export async function getAllProjects(isAdmin: boolean = false): Promise<ProjectItem[]> {
  if (isMongoActive()) {
    const query = isAdmin ? {} : { published: true };
    return ProjectModel.find(query).sort({ order: 1 }).lean<ProjectItem[]>();
  }
  const db = getLocalDb();
  return (isAdmin ? db.projects : db.projects.filter(p => p.published)).sort((a, b) => a.order - b.order);
}

export async function getProjectById(id: string): Promise<ProjectItem | null> {
  if (isMongoActive()) {
    return ProjectModel.findOne({ id }).lean<ProjectItem>();
  }
  const db = getLocalDb();
  return db.projects.find(p => p.id === id) || null;
}

export async function createProject(data: Partial<ProjectItem>): Promise<ProjectItem> {
  const count = isMongoActive()
    ? await ProjectModel.countDocuments()
    : getLocalDb().projects.length;

  const newProject: ProjectItem = {
    id: data.id || `proj-${Date.now()}`,
    title: data.title?.trim() || 'Untitled Project',
    slug: (data.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    shortDesc: data.shortDesc || '',
    fullDesc: data.fullDesc || '',
    category: data.category || '3D Modeling',
    tags: Array.isArray(data.tags) ? data.tags : [],
    software: Array.isArray(data.software) ? data.software : ['Blender 3D'],
    year: data.year || new Date().getFullYear().toString(),
    client: data.client || '',
    thumbnail: data.thumbnail || '/src/assets/images/project_mech_arm_1791315310970.jpg',
    mainImage: data.mainImage || data.thumbnail || '/src/assets/images/project_mech_arm_1791315310970.jpg',
    highResImage: data.highResImage || data.mainImage || data.thumbnail || '',
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    videoUrl: data.videoUrl || '',
    has3DModel: Boolean(data.has3DModel),
    model3DType: data.model3DType || 'procedural-torus',
    model3DUrl: data.model3DUrl || '',
    featured: Boolean(data.featured),
    published: data.published !== false,
    order: Number(data.order) || count + 1,
  };

  if (isMongoActive()) {
    await ProjectModel.create(newProject);
  }

  // Also sync to local JSON
  const db = getLocalDb();
  db.projects.push(newProject);
  saveLocalDb(db);

  return newProject;
}

export async function updateProject(id: string, data: Partial<ProjectItem>): Promise<ProjectItem | null> {
  if (isMongoActive()) {
    const updated = await ProjectModel.findOneAndUpdate(
      { id },
      { $set: data },
      { new: true, runValidators: true }
    ).lean<ProjectItem>();
    if (updated) {
      // Sync local db
      const db = getLocalDb();
      const idx = db.projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        db.projects[idx] = { ...db.projects[idx], ...data, id };
        saveLocalDb(db);
      }
      return updated;
    }
  }

  const db = getLocalDb();
  const idx = db.projects.findIndex(p => p.id === id || String(p.id) === String(id));
  if (idx === -1) return null;

  db.projects[idx] = {
    ...db.projects[idx],
    ...data,
    id: db.projects[idx].id,
  };
  saveLocalDb(db);
  return db.projects[idx];
}

export async function deleteProject(id: string): Promise<boolean> {
  let deletedFromMongo = false;
  if (isMongoActive()) {
    const res = await ProjectModel.deleteOne({ id });
    deletedFromMongo = res.deletedCount > 0;
  }

  const db = getLocalDb();
  const initialLen = db.projects.length;
  db.projects = db.projects.filter(p => p.id !== id && String(p.id) !== String(id));
  const deletedFromLocal = db.projects.length < initialLen;
  if (deletedFromLocal) {
    saveLocalDb(db);
  }

  return deletedFromMongo || deletedFromLocal;
}

/* ==========================================================================
   ACHIEVEMENTS CRUD
   ========================================================================== */
export async function getAchievements(isAdmin: boolean = false): Promise<AchievementItem[]> {
  if (isMongoActive()) {
    const query = isAdmin ? {} : { published: true };
    return AchievementModel.find(query).sort({ order: 1 }).lean<AchievementItem[]>();
  }
  const db = getLocalDb();
  const list = isAdmin ? db.achievements : db.achievements.filter(a => a.published);
  return list.sort((a, b) => a.order - b.order);
}

export async function createAchievement(data: Partial<AchievementItem>): Promise<AchievementItem> {
  const count = isMongoActive()
    ? await AchievementModel.countDocuments()
    : getLocalDb().achievements.length;

  const item: AchievementItem = {
    id: data.id || `ach-${Date.now()}`,
    title: data.title || '',
    subtitle: data.subtitle || data.description || '',
    organization: data.organization || '',
    year: data.year || String(new Date().getFullYear()),
    description: data.description || data.subtitle || '',
    icon: data.icon || 'Trophy',
    image: data.image || data.certificateImage || '',
    certificateImage: data.image || data.certificateImage || '',
    externalLink: data.externalLink || '',
    published: data.published !== false,
    order: Number(data.order) || count + 1,
  };

  if (isMongoActive()) {
    await AchievementModel.create(item);
  }

  const db = getLocalDb();
  db.achievements.push(item);
  saveLocalDb(db);
  return item;
}

export async function updateAchievement(id: string, data: Partial<AchievementItem>): Promise<AchievementItem | null> {
  if (isMongoActive()) {
    const updated = await AchievementModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean<AchievementItem>();
    if (updated) {
      const db = getLocalDb();
      const idx = db.achievements.findIndex(a => a.id === id);
      if (idx !== -1) {
        db.achievements[idx] = { ...db.achievements[idx], ...data, id };
        saveLocalDb(db);
      }
      return updated;
    }
  }

  const db = getLocalDb();
  const idx = db.achievements.findIndex(a => a.id === id);
  if (idx === -1) return null;
  db.achievements[idx] = { ...db.achievements[idx], ...data, id };
  saveLocalDb(db);
  return db.achievements[idx];
}

export async function deleteAchievement(id: string): Promise<boolean> {
  let done = false;
  if (isMongoActive()) {
    const res = await AchievementModel.deleteOne({ id });
    done = res.deletedCount > 0;
  }
  const db = getLocalDb();
  const len = db.achievements.length;
  db.achievements = db.achievements.filter(a => a.id !== id);
  if (db.achievements.length < len) {
    saveLocalDb(db);
    done = true;
  }
  return done;
}

export async function reorderAchievements(orderList: { id: string; order: number }[]): Promise<AchievementItem[]> {
  if (isMongoActive()) {
    await Promise.all(
      orderList.map(item => AchievementModel.updateOne({ id: item.id }, { $set: { order: item.order } }))
    );
  }

  const db = getLocalDb();
  orderList.forEach(item => {
    const ach = db.achievements.find(a => a.id === item.id);
    if (ach) ach.order = item.order;
  });
  saveLocalDb(db);
  return db.achievements.sort((a, b) => a.order - b.order);
}

/* ==========================================================================
   CONTACT MESSAGES
   ========================================================================== */
export async function createMessage(data: { name: string; email: string; phone?: string; address?: string; message: string }): Promise<ContactMessage> {
  const msg: ContactMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: data.name.trim(),
    email: data.email.trim(),
    phone: (data.phone || '').trim(),
    address: (data.address || '').trim(),
    message: data.message.trim(),
    createdAt: new Date().toISOString(),
    read: false,
  };

  if (isMongoActive()) {
    await ContactMessageModel.create(msg);
  }

  const db = getLocalDb();
  db.messages.unshift(msg);
  saveLocalDb(db);
  return msg;
}

export async function getMessages(): Promise<ContactMessage[]> {
  if (isMongoActive()) {
    return ContactMessageModel.find().sort({ createdAt: -1 }).lean<ContactMessage[]>();
  }
  const db = getLocalDb();
  return db.messages;
}

export async function markMessageRead(id: string, read: boolean = true): Promise<ContactMessage | null> {
  if (isMongoActive()) {
    await ContactMessageModel.updateOne({ id }, { $set: { read } });
  }
  const db = getLocalDb();
  const msg = db.messages.find(m => m.id === id);
  if (msg) {
    msg.read = read;
    saveLocalDb(db);
    return msg;
  }
  return null;
}

export async function deleteMessage(id: string): Promise<boolean> {
  let done = false;
  if (isMongoActive()) {
    const res = await ContactMessageModel.deleteOne({ id });
    done = res.deletedCount > 0;
  }
  const db = getLocalDb();
  const len = db.messages.length;
  db.messages = db.messages.filter(m => m.id !== id);
  if (db.messages.length < len) {
    saveLocalDb(db);
    done = true;
  }
  return done;
}

/* ==========================================================================
   CATEGORIES CRUD
   ========================================================================== */
export async function getCategories(): Promise<CategoryItem[]> {
  if (isMongoActive()) {
    return CategoryModel.find().lean<CategoryItem[]>();
  }
  return getLocalDb().categories;
}

export async function createCategory(name: string): Promise<CategoryItem> {
  const cat: CategoryItem = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  };
  if (isMongoActive()) {
    await CategoryModel.create(cat);
  }
  const db = getLocalDb();
  db.categories.push(cat);
  saveLocalDb(db);
  return cat;
}

export async function updateCategory(id: string, data: Partial<CategoryItem>): Promise<CategoryItem | null> {
  if (isMongoActive()) {
    await CategoryModel.updateOne({ id }, { $set: data });
  }
  const db = getLocalDb();
  const idx = db.categories.findIndex(c => c.id === id);
  if (idx === -1) return null;
  db.categories[idx] = { ...db.categories[idx], ...data, id };
  saveLocalDb(db);
  return db.categories[idx];
}

export async function deleteCategory(id: string): Promise<boolean> {
  let done = false;
  if (isMongoActive()) {
    const res = await CategoryModel.deleteOne({ id });
    done = res.deletedCount > 0;
  }
  const db = getLocalDb();
  const len = db.categories.length;
  db.categories = db.categories.filter(c => c.id !== id);
  if (db.categories.length < len) {
    saveLocalDb(db);
    done = true;
  }
  return done;
}

/* ==========================================================================
   SKILLS & EDUCATION CRUD
   ========================================================================== */
export async function getSkills(): Promise<SkillItem[]> {
  if (isMongoActive()) {
    return SkillModel.find().sort({ order: 1 }).lean<SkillItem[]>();
  }
  return getLocalDb().skills.sort((a, b) => a.order - b.order);
}

export async function createSkill(data: Partial<SkillItem>): Promise<SkillItem> {
  const count = isMongoActive() ? await SkillModel.countDocuments() : getLocalDb().skills.length;
  const item: SkillItem = {
    id: data.id || `skill-${Date.now()}`,
    name: data.name || 'New Skill',
    category: data.category || '3d_cad',
    icon: data.icon || 'Box',
    proficiency: Number(data.proficiency) || 80,
    isFloatingHero: Boolean(data.isFloatingHero),
    order: Number(data.order) || count + 1,
    enabled: data.enabled !== false,
  };
  if (isMongoActive()) {
    await SkillModel.create(item);
  }
  const db = getLocalDb();
  db.skills.push(item);
  saveLocalDb(db);
  return item;
}

export async function updateSkill(id: string, data: Partial<SkillItem>): Promise<SkillItem | null> {
  if (isMongoActive()) {
    await SkillModel.updateOne({ id }, { $set: data });
  }
  const db = getLocalDb();
  const idx = db.skills.findIndex(s => s.id === id);
  if (idx === -1) return null;
  db.skills[idx] = { ...db.skills[idx], ...data, id };
  saveLocalDb(db);
  return db.skills[idx];
}

export async function deleteSkill(id: string): Promise<boolean> {
  let done = false;
  if (isMongoActive()) {
    const res = await SkillModel.deleteOne({ id });
    done = res.deletedCount > 0;
  }
  const db = getLocalDb();
  const len = db.skills.length;
  db.skills = db.skills.filter(s => s.id !== id);
  if (db.skills.length < len) {
    saveLocalDb(db);
    done = true;
  }
  return done;
}

export async function getEducation(): Promise<EducationItem[]> {
  if (isMongoActive()) {
    return EducationModel.find().sort({ order: 1 }).lean<EducationItem[]>();
  }
  return getLocalDb().education.sort((a, b) => a.order - b.order);
}

export async function createEducation(data: Partial<EducationItem>): Promise<EducationItem> {
  const count = isMongoActive() ? await EducationModel.countDocuments() : getLocalDb().education.length;
  const item: EducationItem = {
    id: data.id || `edu-${Date.now()}`,
    degree: data.degree || '',
    institution: data.institution || '',
    year: data.year || '',
    result: data.result || '',
    description: data.description || '',
    institutionUrl: data.institutionUrl || '',
    order: Number(data.order) || count + 1,
  };
  if (isMongoActive()) {
    await EducationModel.create(item);
  }
  const db = getLocalDb();
  db.education.push(item);
  saveLocalDb(db);
  return item;
}

export async function updateEducation(id: string, data: Partial<EducationItem>): Promise<EducationItem | null> {
  if (isMongoActive()) {
    await EducationModel.updateOne({ id }, { $set: data });
  }
  const db = getLocalDb();
  const idx = db.education.findIndex(e => e.id === id);
  if (idx === -1) return null;
  db.education[idx] = { ...db.education[idx], ...data, id };
  saveLocalDb(db);
  return db.education[idx];
}

export async function deleteEducation(id: string): Promise<boolean> {
  let done = false;
  if (isMongoActive()) {
    const res = await EducationModel.deleteOne({ id });
    done = res.deletedCount > 0;
  }
  const db = getLocalDb();
  const len = db.education.length;
  db.education = db.education.filter(e => e.id !== id);
  if (db.education.length < len) {
    saveLocalDb(db);
    done = true;
  }
  return done;
}

/* ==========================================================================
   SETTINGS, HERO, ABOUT, SOCIALS, NAV, FOOTER SINGLETON UPDATES
   ========================================================================== */
export async function updateSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  if (isMongoActive()) {
    await SettingsModel.updateOne({}, { $set: data }, { upsert: true });
  }
  const db = getLocalDb();
  db.settings = { ...db.settings, ...data };
  saveLocalDb(db);
  return db.settings;
}

export async function updateHero(data: Partial<HeroData>): Promise<HeroData> {
  if (isMongoActive()) {
    await HeroModel.updateOne({}, { $set: data }, { upsert: true });
  }
  const db = getLocalDb();
  db.hero = { ...db.hero, ...data };
  saveLocalDb(db);
  return db.hero;
}

export async function updateAbout(data: Partial<AboutData>): Promise<AboutData> {
  if (isMongoActive()) {
    await AboutModel.updateOne({}, { $set: data }, { upsert: true });
  }
  const db = getLocalDb();
  db.about = { ...db.about, ...data };
  saveLocalDb(db);
  return db.about;
}

export async function updateNavigation(data: any): Promise<any> {
  if (isMongoActive()) {
    await NavigationModel.updateOne({}, { $set: data }, { upsert: true });
  }
  const db = getLocalDb();
  db.navigation = { ...db.navigation, ...data };
  saveLocalDb(db);
  return db.navigation;
}

export async function updateFooter(data: Partial<FooterData>): Promise<FooterData> {
  if (isMongoActive()) {
    await FooterModel.updateOne({}, { $set: data }, { upsert: true });
  }
  const db = getLocalDb();
  db.footer = { ...db.footer, ...data };
  saveLocalDb(db);
  return db.footer;
}

export async function getSocials(isAdmin: boolean = false): Promise<SocialLink[]> {
  if (isMongoActive()) {
    const q = isAdmin ? {} : { enabled: true };
    return SocialLinkModel.find(q).sort({ order: 1 }).lean<SocialLink[]>();
  }
  const db = getLocalDb();
  return (isAdmin ? db.socials : db.socials.filter(s => s.enabled)).sort((a, b) => a.order - b.order);
}

export async function createSocial(data: Partial<SocialLink>): Promise<SocialLink> {
  const count = isMongoActive() ? await SocialLinkModel.countDocuments() : getLocalDb().socials.length;
  const item: SocialLink = {
    id: data.id || `soc-${Date.now()}`,
    platform: data.platform || 'Platform',
    url: data.url || 'https://',
    icon: data.icon || 'Globe',
    order: Number(data.order) || count + 1,
    enabled: data.enabled !== false,
  };
  if (isMongoActive()) {
    await SocialLinkModel.create(item);
  }
  const db = getLocalDb();
  db.socials.push(item);
  saveLocalDb(db);
  return item;
}

export async function updateSocial(id: string, data: Partial<SocialLink>): Promise<SocialLink | null> {
  if (isMongoActive()) {
    await SocialLinkModel.updateOne({ id }, { $set: data });
  }
  const db = getLocalDb();
  const idx = db.socials.findIndex(s => s.id === id);
  if (idx === -1) return null;
  db.socials[idx] = { ...db.socials[idx], ...data, id };
  saveLocalDb(db);
  return db.socials[idx];
}

export async function deleteSocial(id: string): Promise<boolean> {
  let done = false;
  if (isMongoActive()) {
    const res = await SocialLinkModel.deleteOne({ id });
    done = res.deletedCount > 0;
  }
  const db = getLocalDb();
  const len = db.socials.length;
  db.socials = db.socials.filter(s => s.id !== id);
  if (db.socials.length < len) {
    saveLocalDb(db);
    done = true;
  }
  return done;
}

/* ==========================================================================
   ADMIN ACCOUNT OPERATIONS
   ========================================================================== */
export async function getAdminAccount(): Promise<AdminUser | null> {
  if (isMongoActive()) {
    const adminDoc = await AdminModel.findOne().lean<AdminUser>();
    if (adminDoc) return adminDoc;
  }
  const db = getLocalDb();
  return db.admin;
}

export async function updateAdminCredentials(newHash: string, newSalt: string): Promise<boolean> {
  const now = new Date().toISOString();
  if (isMongoActive()) {
    await AdminModel.updateOne(
      {},
      { $set: { passwordHash: newHash, salt: newSalt, updatedAt: now } },
      { upsert: true }
    );
  }
  const db = getLocalDb();
  db.admin.passwordHash = newHash;
  db.admin.salt = newSalt;
  db.admin.updatedAt = now;
  saveLocalDb(db);
  return true;
}
