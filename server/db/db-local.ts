import fs from 'node:fs';
import path from 'node:path';
import { hashPassword } from '../auth.ts';
import type { DatabaseSchema } from '../types.ts';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

const INITIAL_HERO_IMAGE = '/src/assets/images/hero_3d_character_1791315281517.jpg';
const INITIAL_ABOUT_IMAGE = '/src/assets/images/about_3d_character_1791315295328.jpg';

export function getInitialDatabase(): DatabaseSchema {
  const initialAdminPass = process.env.ADMIN_PASSWORD || 'nayem3d2026';
  const initialAdminUser = process.env.ADMIN_USERNAME || 'admin';
  const { hash, salt } = hashPassword(initialAdminPass);

  return {
    admin: {
      id: 'admin-1',
      username: initialAdminUser,
      passwordHash: hash,
      salt: salt,
      updatedAt: new Date().toISOString(),
    },
    settings: {
      siteTitle: 'MD NAYEM HOSSAIN — 3D Artist & EEE Engineer',
      metaDescription: 'Official portfolio of MD NAYEM HOSSAIN. Specializing in 3D modeling, game assets, product visualization, and industrial mechanical design.',
      keywords: 'MD NAYEM HOSSAIN, 3D Artist, EEE Engineer, Blender 3D, SolidWorks, Product Visualization, Game Assets, Industrial Design, Bangladesh',
      ogImage: INITIAL_HERO_IMAGE,
      contactEmail: 'nayemh161@gmail.com',
      contactPhone: '+8801318527145',
      contactWhatsapp: '+8801984-382715',
      contactLocation: 'Bajitpur, Kishoreganj, Dhaka, Bangladesh',
      maintenanceMode: false,
    },
    hero: {
      heading: "I'm EEE Engineer & 3D Artist",
      bio: "Believe in working and consistency in chasing the dream",
      characterImage: INITIAL_HERO_IMAGE,
      rightGreeting: "Hello! I Am MD NAYEM HOSSAIN",
      rightTitle: "3D modeling and product visualization",
      rightRole: "A designer who",
      rightSubtitle: "You will get here huge game assets achieve elements, and industrial product design with proper management.",
      ctaText: "View My Projects",
      ctaLink: "#projects",
      secondaryCtaText: "Hire Me",
      secondaryCtaLink: "https://wa.me/8801984382715",
    },
    about: {
      heading: "About Me",
      intro: "Bridging the gap between engineering precision and creative 3D artistry.",
      detailedBio: "I am an Electrical and Electronic Engineer with a passionate dedication to high-fidelity 3D modeling, game asset development, and industrial product visualization. My background in engineering allows me to understand functional mechanics, structural aesthetics, and precision CAD, while my 3D art experience empowers me to bring concepts to life with cinematic realism.",
      characterImage: INITIAL_ABOUT_IMAGE,
      softSkills: [
        { id: 'soft-1', name: 'Communication', order: 1, enabled: true },
        { id: 'soft-2', name: 'Networking', order: 2, enabled: true },
        { id: 'soft-3', name: 'Leadership Quality', order: 3, enabled: true },
        { id: 'soft-4', name: 'Decision Making', order: 4, enabled: true },
        { id: 'soft-5', name: 'Problem Solving', order: 5, enabled: true },
      ],
      experienceYears: "5+",
      completedProjects: "40+",
    },
    education: [
      {
        id: 'edu-3',
        degree: 'B.Sc. in Electrical and Electronic Engineering (EEE)',
        institution: 'Green University of Bangladesh',
        year: '2019 – 2023',
        result: 'CGPA 3.29 / 4.00',
        description: 'Comprehensive study of circuit design, robotics, power systems, industrial automation, and micro-electromechanical systems.',
        order: 1,
      },
      {
        id: 'edu-2',
        degree: 'Diploma in Engineering',
        institution: 'SSR Institute of Technology and Management',
        year: '2019',
        result: 'CGPA 3.23 / 4.00',
        description: 'Applied technical foundation, mechanical drafting, CAD principles, and laboratory engineering operations.',
        order: 2,
      },
      {
        id: 'edu-1',
        degree: 'Secondary School Certificate (SSC)',
        institution: 'Sararchar Sibnath Bahumukhi High School',
        year: '2015',
        result: 'GPA 4.06 / 5.00',
        description: 'Science curriculum with distinction in mathematics, physics, and computer science.',
        order: 3,
      },
    ],
    skills: [
      { id: 'skill-1', name: 'Blender 3D', category: '3d_cad', icon: 'Box', proficiency: 95, isFloatingHero: true, order: 1, enabled: true },
      { id: 'skill-2', name: 'Solid Works', category: '3d_cad', icon: 'Wrench', proficiency: 90, isFloatingHero: true, order: 2, enabled: true },
      { id: 'skill-3', name: 'MATLAB', category: 'engineering', icon: 'BarChart3', proficiency: 85, isFloatingHero: true, order: 3, enabled: true },
      { id: 'skill-4', name: 'AutoCAD', category: '3d_cad', icon: 'Cpu', proficiency: 88, isFloatingHero: true, order: 4, enabled: true },
      { id: 'skill-5', name: 'Substance Painter', category: 'software', icon: 'Sparkles', proficiency: 82, isFloatingHero: false, order: 5, enabled: true },
      { id: 'skill-6', name: 'Unreal Engine 5', category: 'software', icon: 'Layers', proficiency: 80, isFloatingHero: false, order: 6, enabled: true },
      { id: 'skill-7', name: 'Python for CAD', category: 'programming', icon: 'Terminal', proficiency: 75, isFloatingHero: false, order: 7, enabled: true },
    ],
    categories: [
      { id: 'cat-1', name: '3D Modeling', slug: '3d-modeling' },
      { id: 'cat-2', name: 'Product Design', slug: 'product-design' },
      { id: 'cat-3', name: 'Industrial CAD', slug: 'industrial-cad' },
      { id: 'cat-4', name: 'Game Assets', slug: 'game-assets' },
      { id: 'cat-5', name: 'Mechanical Assemblies', slug: 'mechanical-assemblies' },
      { id: 'cat-6', name: 'Robotics & EEE', slug: 'robotics-eee' },
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'Precision Robotic Arm Assembly',
        slug: 'precision-robotic-arm-assembly',
        shortDesc: '6-Axis articulated industrial robotic arm engineered with high-precision servo joints and mechanical edge-flow topology.',
        fullDesc: 'Comprehensive industrial CAD and 3D modeling project bridging kinematic accuracy with photorealistic rendering. Modeled down to internal ball bearings and wire conduits.',
        category: 'Industrial CAD',
        tags: ['Kinematics', 'Sub-D', 'PBR Shading', 'Hard Surface'],
        software: ['Blender 3D', 'SolidWorks', 'Substance Painter'],
        year: '2026',
        client: 'Automation Robotics Lab',
        thumbnail: '/src/assets/images/project_mech_arm_1791315310970.jpg',
        mainImage: '/src/assets/images/project_mech_arm_1791315310970.jpg',
        highResImage: '/src/assets/images/project_mech_arm_1791315310970.jpg',
        gallery: [
          '/src/assets/images/project_mech_arm_1791315310970.jpg',
          '/src/assets/images/project_headphone_1791315325859.jpg',
        ],
        has3DModel: true,
        model3DType: 'procedural-mech',
        featured: true,
        published: true,
        order: 1,
      },
      {
        id: 'proj-2',
        title: 'Audiophile ANC Studio Headphones',
        slug: 'audiophile-anc-studio-headphones',
        shortDesc: 'Premium wireless acoustic headphones with brushed aluminum accents, perforated memory-foam leather, and acoustic chambers.',
        fullDesc: 'Commercial product visualization project focusing on tactile surface finishes, micro-chamfer bevels, and cinematic lighting setups.',
        category: 'Product Design',
        tags: ['Product Viz', 'Raytracing', 'Commercial Render', 'Acoustics'],
        software: ['Blender Cycles', 'Substance Designer', 'Photoshop'],
        year: '2025',
        client: 'SoundPulse Audio Inc.',
        thumbnail: '/src/assets/images/project_headphone_1791315325859.jpg',
        mainImage: '/src/assets/images/project_headphone_1791315325859.jpg',
        highResImage: '/src/assets/images/project_headphone_1791315325859.jpg',
        gallery: [
          '/src/assets/images/project_headphone_1791315325859.jpg',
          '/src/assets/images/project_drone_1791315340156.jpg',
        ],
        has3DModel: true,
        model3DType: 'procedural-torus',
        featured: true,
        published: true,
        order: 2,
      },
      {
        id: 'proj-3',
        title: 'Tactical Reconnaissance Quadcopter',
        slug: 'tactical-reconnaissance-quadcopter',
        shortDesc: 'Carbon-fiber aerodynamic UAV featuring gimbal 4K thermal optics, carbon-weave rotors, and integrated telemetry avionics.',
        fullDesc: 'Designed to game-ready specs with optimized LOD geometry and 4K PBR UDIM texture sets. Clean non-overlapping UV packing.',
        category: 'Game Assets',
        tags: ['Game Ready', 'Unreal Engine', 'Substance', 'Sci-Fi Hard Surface'],
        software: ['Blender 3D', 'Unreal Engine 5', 'Marmoset Toolbag'],
        year: '2025',
        client: 'AeroVanguard Defence',
        thumbnail: '/src/assets/images/project_drone_1791315340156.jpg',
        mainImage: '/src/assets/images/project_drone_1791315340156.jpg',
        highResImage: '/src/assets/images/project_drone_1791315340156.jpg',
        gallery: [
          '/src/assets/images/project_drone_1791315340156.jpg',
          '/src/assets/images/project_mech_arm_1791315310970.jpg',
        ],
        has3DModel: true,
        model3DType: 'procedural-cube',
        featured: true,
        published: true,
        order: 3,
      },
      {
        id: 'proj-4',
        title: 'Smart Energy IoT Meter & Enclosure',
        slug: 'smart-energy-iot-meter-enclosure',
        shortDesc: 'IP67 rated industrial enclosure designed for smart power grid telemetry and high-voltage power monitoring.',
        fullDesc: 'Complete product engineering from SolidWorks parametric CAD models directly converted to presentation-ready 3D renders with exploded-view animations.',
        category: 'Robotics & EEE',
        tags: ['Industrial Design', 'SolidWorks', 'Injection Molding', 'EEE'],
        software: ['SolidWorks', 'KeyShot', 'Blender 3D'],
        year: '2024',
        client: 'Green Energy PowerGrid',
        thumbnail: '/src/assets/images/project_mech_arm_1791315310970.jpg',
        mainImage: '/src/assets/images/project_mech_arm_1791315310970.jpg',
        highResImage: '/src/assets/images/project_mech_arm_1791315310970.jpg',
        gallery: ['/src/assets/images/project_mech_arm_1791315310970.jpg'],
        has3DModel: false,
        featured: false,
        published: true,
        order: 4,
      },
    ],
    achievements: [
      {
        id: 'ach-1',
        title: 'Diploma in Engineering Excellence Award',
        subtitle: 'Ranked 1st Class with Distinction in Applied Mechanical & Electrical Technology',
        organization: 'SSR Institute of Technology & Management',
        year: '2019',
        description: 'Awarded for exceptional academic performance, engineering project leadership, and technical innovation.',
        icon: 'Trophy',
        image: '/uploads/ssr_award_certificate_1791489770946.jpg',
        certificateImage: '/uploads/ssr_award_certificate_1791489770946.jpg',
        published: true,
        order: 1,
      },
      {
        id: 'ach-2',
        title: 'Best 3D CAD Assembly & Visualization Award',
        subtitle: 'National Engineering Design Competition',
        organization: 'Green University Engineering Symposium',
        year: '2022',
        description: 'Recognized for pioneering edge-flow topology in complex industrial assemblies.',
        icon: 'Award',
        image: '/src/assets/images/project_mech_arm_1791315310970.jpg',
        certificateImage: '/src/assets/images/project_mech_arm_1791315310970.jpg',
        published: true,
        order: 2,
      },
    ],
    messages: [
      {
        id: 'msg-seed-1',
        name: 'Alex Rivera',
        email: 'alex.rivera@apexinteractive.com',
        phone: '+1 (555) 234-8901',
        address: 'San Francisco, CA, USA',
        message: 'Hello Nayem! We were thoroughly impressed by your robotic arm and hard-surface models. We have an upcoming AAA sci-fi title and would love to contract you for lead weapon and vehicle asset modeling.',
        createdAt: '2026-03-28T14:32:00.000Z',
        read: false,
      },
      {
        id: 'msg-seed-2',
        name: 'Marcus Vance',
        email: 'm.vance@vancemedia.de',
        phone: '+49 170 5551234',
        address: 'Munich, Germany',
        message: 'Hi Nayem, looking for a 3D artist with actual mechanical engineering background for industrial equipment rendering. Can we schedule a Zoom consultation?',
        createdAt: '2026-03-25T09:15:00.000Z',
        read: true,
      },
    ],
    socials: [
      { id: 'soc-1', platform: 'ArtStation', url: 'https://artstation.com', icon: 'Palette', order: 1, enabled: true },
      { id: 'soc-2', platform: 'LinkedIn', url: 'https://linkedin.com', icon: 'Linkedin', order: 2, enabled: true },
      { id: 'soc-3', platform: 'GitHub', url: 'https://github.com', icon: 'Github', order: 3, enabled: true },
      { id: 'soc-4', platform: 'WhatsApp', url: 'https://wa.me/8801984382715', icon: 'Phone', order: 4, enabled: true },
      { id: 'soc-5', platform: 'Facebook', url: 'https://facebook.com', icon: 'Globe', order: 5, enabled: true },
    ],
    navigation: {
      items: [
        { id: 'nav-1', label: 'Home', href: '#home', order: 1, enabled: true },
        { id: 'nav-2', label: 'About', href: '#about', order: 2, enabled: true },
        { id: 'nav-3', label: 'Projects', href: '#projects', order: 3, enabled: true },
        { id: 'nav-4', label: 'Achievements', href: '#achievements', order: 4, enabled: true },
        { id: 'nav-5', label: 'Contact', href: '#contact', order: 5, enabled: true },
      ],
      hireMeText: 'Hire Me',
      hireMeHref: 'https://wa.me/8801984382715',
    },
    footer: {
      brandName: 'MD NAYEM HOSSAIN',
      tagline: 'EEE Engineer & Professional 3D Artist',
      copyrightText: '© 2026 MD NAYEM HOSSAIN. All rights reserved.',
      showSocials: true,
    },
  };
}

let dbCache: DatabaseSchema | null = null;
let lastDbMtime = 0;

export function getDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const stats = fs.statSync(DB_FILE);
      if (dbCache && stats.mtimeMs === lastDbMtime) {
        return dbCache;
      }

      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed: DatabaseSchema = JSON.parse(data);
      lastDbMtime = stats.mtimeMs;

      // Upgrade / migrate schema fields if needed
      let needsSave = false;
      if (!parsed.about.softSkills || !Array.isArray(parsed.about.softSkills) || parsed.about.softSkills.length === 0) {
        parsed.about.softSkills = [
          { id: 'soft-1', name: 'Communication', order: 1, enabled: true },
          { id: 'soft-2', name: 'Networking', order: 2, enabled: true },
          { id: 'soft-3', name: 'Leadership Quality', order: 3, enabled: true },
          { id: 'soft-4', name: 'Decision Making', order: 4, enabled: true },
          { id: 'soft-5', name: 'Problem Solving', order: 5, enabled: true },
        ];
        needsSave = true;
      }

      if (!parsed.navigation.hireMeHref || parsed.navigation.hireMeHref === '#contact') {
        parsed.navigation.hireMeHref = 'https://wa.me/8801984382715';
        needsSave = true;
      }

      if (parsed.settings && parsed.settings.contactWhatsapp !== '+8801984-382715') {
        parsed.settings.contactWhatsapp = '+8801984-382715';
        needsSave = true;
      }

      dbCache = parsed;
      if (needsSave) {
        saveDatabase(dbCache);
      }
      return dbCache;
    }
  } catch (err) {
    console.error('Error reading db.json, falling back to default:', err);
  }

  dbCache = getInitialDatabase();
  saveDatabase(dbCache);
  return dbCache;
}

export function saveDatabase(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    dbCache = data;
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
    try {
      lastDbMtime = fs.statSync(DB_FILE).mtimeMs;
    } catch {}
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}
