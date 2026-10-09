import mongoose, { Schema, Document } from 'mongoose';
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
} from '../types.ts';

/* ==========================================================================
   MONGOOSE CONNECTION MANAGEMENT
   ========================================================================== */
let isConnected = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectMongo(uri?: string): Promise<boolean> {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    return false;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  if (connectionPromise) {
    try {
      await connectionPromise;
      return mongoose.connection.readyState === 1;
    } catch {
      return false;
    }
  }

  try {
    connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await connectionPromise;
    isConnected = true;
    console.log('✅ [DATABASE] Connected to MongoDB Atlas successfully.');
    return true;
  } catch (err: any) {
    isConnected = false;
    connectionPromise = null;
    console.error('❌ [DATABASE] Failed to connect to MongoDB Atlas:', err.message);
    return false;
  }
}

export function isMongoActive(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getMongoConnectionState(): { state: number; status: string } {
  const state = mongoose.connection.readyState;
  const map: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return { state, status: map[state] || 'unknown' };
}

/* ==========================================================================
   SCHEMAS & MODELS
   ========================================================================== */

// 1. Admin User
const AdminSchema = new Schema<AdminUser & Document>({
  id: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

export const AdminModel = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

// 2. Projects (500+ items scalability)
const ProjectSchema = new Schema<ProjectItem & Document>({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  shortDesc: { type: String, default: '' },
  fullDesc: { type: String, default: '' },
  category: { type: String, required: true, index: true },
  tags: { type: [String], default: [] },
  software: { type: [String], default: [] },
  year: { type: String, default: () => new Date().getFullYear().toString() },
  client: { type: String, default: '' },
  thumbnail: { type: String, required: true },
  mainImage: { type: String, required: true },
  highResImage: { type: String, default: '' },
  gallery: { type: [String], default: [] },
  videoUrl: { type: String, default: '' },
  has3DModel: { type: Boolean, default: false },
  model3DType: {
    type: String,
    enum: ['glb-custom', 'procedural-mech', 'procedural-torus', 'procedural-cube'],
    default: 'procedural-torus',
  },
  model3DUrl: { type: String, default: '' },
  featured: { type: Boolean, default: false, index: true },
  published: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0, index: true },
}, { timestamps: true });

// Compound and text indexes for fast search and pagination
ProjectSchema.index({ published: 1, order: 1 });
ProjectSchema.index({ category: 1, published: 1 });
ProjectSchema.index({ title: 'text', shortDesc: 'text', fullDesc: 'text', tags: 'text' });

export const ProjectModel = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

// 3. Achievements
const AchievementSchema = new Schema<AchievementItem & Document>({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  organization: { type: String, default: '' },
  year: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: 'Trophy' },
  image: { type: String, default: '' },
  certificateImage: { type: String, default: '' },
  externalLink: { type: String, default: '' },
  published: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0, index: true },
}, { timestamps: true });

AchievementSchema.index({ published: 1, order: 1 });

export const AchievementModel = mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema);

// 4. Categories
const CategorySchema = new Schema<CategoryItem & Document>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
}, { timestamps: true });

export const CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);

// 5. Skills
const SkillSchema = new Schema<SkillItem & Document>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['3d_cad', 'software', 'engineering', 'programming', 'other'],
    default: '3d_cad',
  },
  icon: { type: String, default: 'Box' },
  proficiency: { type: Number, default: 80 },
  isFloatingHero: { type: Boolean, default: false },
  order: { type: Number, default: 0, index: true },
  enabled: { type: Boolean, default: true, index: true },
}, { timestamps: true });

SkillSchema.index({ enabled: 1, order: 1 });

export const SkillModel = mongoose.models.Skill || mongoose.model('Skill', SkillSchema);

// 6. Education
const EducationSchema = new Schema<EducationItem & Document>({
  id: { type: String, required: true, unique: true, index: true },
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  year: { type: String, default: '' },
  result: { type: String, default: '' },
  description: { type: String, default: '' },
  institutionUrl: { type: String, default: '' },
  order: { type: Number, default: 0, index: true },
}, { timestamps: true });

EducationSchema.index({ order: 1 });

export const EducationModel = mongoose.models.Education || mongoose.model('Education', EducationSchema);

// 7. Contact Messages
const ContactMessageSchema = new Schema<ContactMessage & Document>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  message: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString(), index: true },
  read: { type: Boolean, default: false, index: true },
}, { timestamps: true });

ContactMessageSchema.index({ createdAt: -1 });

export const ContactMessageModel = mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema);

// 8. Social Links
const SocialLinkSchema = new Schema<SocialLink & Document>({
  id: { type: String, required: true, unique: true, index: true },
  platform: { type: String, required: true },
  url: { type: String, required: true },
  icon: { type: String, default: 'Globe' },
  order: { type: Number, default: 0, index: true },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

export const SocialLinkModel = mongoose.models.SocialLink || mongoose.model('SocialLink', SocialLinkSchema);

// 9. Site Settings (Singleton)
const SettingsSchema = new Schema<SiteSettings & Document>({
  siteTitle: { type: String, default: 'MD NAYEM HOSSAIN — 3D Artist & EEE Engineer' },
  metaDescription: { type: String, default: '' },
  keywords: { type: String, default: '' },
  ogImage: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  contactWhatsapp: { type: String, default: '' },
  contactLocation: { type: String, default: '' },
  maintenanceMode: { type: Boolean, default: false },
}, { timestamps: true });

export const SettingsModel = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

// 10. Hero (Singleton)
const HeroSchema = new Schema<HeroData & Document>({
  heading: { type: String, default: '' },
  bio: { type: String, default: '' },
  characterImage: { type: String, default: '' },
  rightGreeting: { type: String, default: '' },
  rightTitle: { type: String, default: '' },
  rightRole: { type: String, default: '' },
  rightSubtitle: { type: String, default: '' },
  ctaText: { type: String, default: '' },
  ctaLink: { type: String, default: '' },
  secondaryCtaText: { type: String, default: '' },
  secondaryCtaLink: { type: String, default: '' },
}, { timestamps: true });

export const HeroModel = mongoose.models.Hero || mongoose.model('Hero', HeroSchema);

// 11. About (Singleton with embedded softSkills)
const AboutSchema = new Schema<AboutData & Document>({
  heading: { type: String, default: '' },
  intro: { type: String, default: '' },
  detailedBio: { type: String, default: '' },
  characterImage: { type: String, default: '' },
  softSkills: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  }],
  experienceYears: { type: String, default: '5+' },
  completedProjects: { type: String, default: '40+' },
}, { timestamps: true });

export const AboutModel = mongoose.models.About || mongoose.model('About', AboutSchema);

// 12. Navigation (Singleton)
const NavigationSchema = new Schema<{
  items: NavigationItem[];
  hireMeText: string;
  hireMeHref: string;
} & Document>({
  items: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    href: { type: String, required: true },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  }],
  hireMeText: { type: String, default: 'Hire Me' },
  hireMeHref: { type: String, default: 'https://wa.me/8801984382715' },
}, { timestamps: true });

export const NavigationModel = mongoose.models.Navigation || mongoose.model('Navigation', NavigationSchema);

// 13. Footer (Singleton)
const FooterSchema = new Schema<FooterData & Document>({
  brandName: { type: String, default: 'MD NAYEM HOSSAIN' },
  tagline: { type: String, default: 'EEE Engineer & Professional 3D Artist' },
  copyrightText: { type: String, default: '© 2026 MD NAYEM HOSSAIN. All rights reserved.' },
  showSocials: { type: Boolean, default: true },
}, { timestamps: true });

export const FooterModel = mongoose.models.Footer || mongoose.model('Footer', FooterSchema);

// 14. Media Asset Record (Stores cloud metadata without storing raw base64)
export interface MediaAsset {
  id: string;
  url: string;
  publicId?: string;
  provider: 'cloudinary' | 's3' | 'local';
  mimeType: string;
  size: number;
  originalName: string;
  category: 'image' | 'video' | 'model3d' | 'certificate' | 'other';
  createdAt: string;
}

const MediaAssetSchema = new Schema<MediaAsset & Document>({
  id: { type: String, required: true, unique: true, index: true },
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
  provider: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, default: 0 },
  originalName: { type: String, default: '' },
  category: { type: String, default: 'other' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

export const MediaAssetModel = mongoose.models.MediaAsset || mongoose.model('MediaAsset', MediaAssetSchema);
