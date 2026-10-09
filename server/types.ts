export interface SiteSettings {
  siteTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactLocation: string;
  maintenanceMode: boolean;
}

export interface HeroData {
  heading: string;
  bio: string;
  characterImage: string;
  rightGreeting: string;
  rightTitle: string;
  rightRole: string;
  rightSubtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
}

export interface SoftSkillItem {
  id: string;
  name: string;
  order: number;
  enabled: boolean;
}

export interface AboutData {
  heading: string;
  intro: string;
  detailedBio: string;
  characterImage: string;
  softSkills: SoftSkillItem[];
  experienceYears?: string;
  completedProjects?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
  result: string;
  description?: string;
  institutionUrl?: string;
  order: number;
}

export interface SkillItem {
  id: string;
  name: string;
  category: '3d_cad' | 'software' | 'engineering' | 'programming' | 'other';
  icon: string;
  proficiency: number; // 0 - 100
  isFloatingHero: boolean;
  order: number;
  enabled: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  fullDesc: string;
  category: string;
  tags: string[];
  software: string[];
  year: string;
  client?: string;
  thumbnail: string;
  mainImage: string;
  highResImage?: string;
  gallery: string[];
  videoUrl?: string;
  has3DModel?: boolean;
  model3DType?: 'glb-custom' | 'procedural-mech' | 'procedural-torus' | 'procedural-cube';
  model3DUrl?: string;
  featured: boolean;
  published: boolean;
  order: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  subtitle?: string;
  organization: string;
  year: string;
  description: string;
  icon?: string;
  image?: string;
  certificateImage?: string;
  externalLink?: string;
  published: boolean;
  order: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  order: number;
  enabled: boolean;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  order: number;
  enabled: boolean;
}

export interface FooterData {
  brandName: string;
  tagline: string;
  copyrightText: string;
  showSocials: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  admin: AdminUser;
  settings: SiteSettings;
  hero: HeroData;
  about: AboutData;
  education: EducationItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  categories: CategoryItem[];
  achievements: AchievementItem[];
  messages: ContactMessage[];
  socials: SocialLink[];
  navigation: {
    items: NavigationItem[];
    hireMeText: string;
    hireMeHref: string;
  };
  footer: FooterData;
}
