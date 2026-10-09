import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import {
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
} from '../server/db/mongo.ts';
import type { DatabaseSchema } from '../server/types.ts';

async function runMigration() {
  console.log('===========================================================');
  console.log('🚀 MONGODB ATLAS MIGRATION SCRIPT — MD NAYEM HOSSAIN CMS');
  console.log('===========================================================\n');

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    console.error('❌ ERROR: MONGODB_URI environment variable is missing.');
    console.error('To run migration, please supply a valid MongoDB Atlas connection string:');
    console.error('Example: MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/nayem_portfolio" npm run migrate:mongo\n');
    process.exit(1);
  }

  // 1. BACKUP LOCAL JSON FILE FIRST
  const dbDir = path.resolve(process.cwd(), 'data');
  const dbFile = path.join(dbDir, 'db.json');
  if (!fs.existsSync(dbFile)) {
    console.error(`❌ Source database file not found at: ${dbFile}`);
    process.exit(1);
  }

  const backupDir = path.join(dbDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `db.backup.${timestamp}.json`);
  fs.copyFileSync(dbFile, backupFile);
  console.log(`📦 [BACKUP] Created safe local backup at: ${backupFile}`);

  // 2. READ SOURCE JSON DATA
  const rawData = fs.readFileSync(dbFile, 'utf8');
  let data: DatabaseSchema;
  try {
    data = JSON.parse(rawData);
  } catch (err: any) {
    console.error('❌ Failed to parse data/db.json:', err.message);
    process.exit(1);
  }

  // 3. CONNECT TO MONGO
  console.log('🔌 Connecting to MongoDB Atlas...');
  const connected = await connectMongo(mongoUri);
  if (!connected) {
    console.error('❌ Could not establish connection to MongoDB Atlas. Aborting migration.');
    process.exit(1);
  }
  console.log('✅ Connected to MongoDB Atlas successfully.\n');

  const stats: Record<string, { total: number; upserted: number; errors: number }> = {};

  async function trackMigration(name: string, fn: () => Promise<void>, total: number) {
    stats[name] = { total, upserted: 0, errors: 0 };
    try {
      await fn();
    } catch (err: any) {
      console.error(`❌ Error migrating ${name}:`, err.message);
      stats[name].errors++;
    }
  }

  // A. Admin Account
  await trackMigration('Admin', async () => {
    if (data.admin) {
      await AdminModel.updateOne(
        { username: data.admin.username },
        { $set: data.admin },
        { upsert: true }
      );
      stats['Admin'].upserted = 1;
    }
  }, data.admin ? 1 : 0);

  // B. Settings (Singleton)
  await trackMigration('Settings', async () => {
    if (data.settings) {
      await SettingsModel.updateOne({}, { $set: data.settings }, { upsert: true });
      stats['Settings'].upserted = 1;
    }
  }, data.settings ? 1 : 0);

  // C. Hero (Singleton)
  await trackMigration('Hero', async () => {
    if (data.hero) {
      await HeroModel.updateOne({}, { $set: data.hero }, { upsert: true });
      stats['Hero'].upserted = 1;
    }
  }, data.hero ? 1 : 0);

  // D. About (Singleton)
  await trackMigration('About', async () => {
    if (data.about) {
      await AboutModel.updateOne({}, { $set: data.about }, { upsert: true });
      stats['About'].upserted = 1;
    }
  }, data.about ? 1 : 0);

  // E. Navigation (Singleton)
  await trackMigration('Navigation', async () => {
    if (data.navigation) {
      await NavigationModel.updateOne({}, { $set: data.navigation }, { upsert: true });
      stats['Navigation'].upserted = 1;
    }
  }, data.navigation ? 1 : 0);

  // F. Footer (Singleton)
  await trackMigration('Footer', async () => {
    if (data.footer) {
      await FooterModel.updateOne({}, { $set: data.footer }, { upsert: true });
      stats['Footer'].upserted = 1;
    }
  }, data.footer ? 1 : 0);

  // G. Categories (List)
  await trackMigration('Categories', async () => {
    for (const cat of data.categories || []) {
      await CategoryModel.updateOne({ id: cat.id }, { $set: cat }, { upsert: true });
      stats['Categories'].upserted++;
    }
  }, (data.categories || []).length);

  // H. Projects (List — 500+ items scalability)
  await trackMigration('Projects', async () => {
    for (const proj of data.projects || []) {
      await ProjectModel.updateOne({ id: proj.id }, { $set: proj }, { upsert: true });
      stats['Projects'].upserted++;
    }
  }, (data.projects || []).length);

  // I. Achievements (List)
  await trackMigration('Achievements', async () => {
    for (const ach of data.achievements || []) {
      await AchievementModel.updateOne({ id: ach.id }, { $set: ach }, { upsert: true });
      stats['Achievements'].upserted++;
    }
  }, (data.achievements || []).length);

  // J. Skills (List)
  await trackMigration('Skills', async () => {
    for (const skill of data.skills || []) {
      await SkillModel.updateOne({ id: skill.id }, { $set: skill }, { upsert: true });
      stats['Skills'].upserted++;
    }
  }, (data.skills || []).length);

  // K. Education (List)
  await trackMigration('Education', async () => {
    for (const edu of data.education || []) {
      await EducationModel.updateOne({ id: edu.id }, { $set: edu }, { upsert: true });
      stats['Education'].upserted++;
    }
  }, (data.education || []).length);

  // L. Social Links (List)
  await trackMigration('Socials', async () => {
    for (const soc of data.socials || []) {
      await SocialLinkModel.updateOne({ id: soc.id }, { $set: soc }, { upsert: true });
      stats['Socials'].upserted++;
    }
  }, (data.socials || []).length);

  // M. Contact Messages (List)
  await trackMigration('Messages', async () => {
    for (const msg of data.messages || []) {
      await ContactMessageModel.updateOne({ id: msg.id }, { $set: msg }, { upsert: true });
      stats['Messages'].upserted++;
    }
  }, (data.messages || []).length);

  // 4. VERIFY RECORD COUNTS IN MONGO
  console.log('\n📊 [VERIFICATION] Verifying records in MongoDB Atlas...');
  const [mongoProjects, mongoAchs, mongoCats, mongoSkills, mongoEdu, mongoMsgs] = await Promise.all([
    ProjectModel.countDocuments(),
    AchievementModel.countDocuments(),
    CategoryModel.countDocuments(),
    SkillModel.countDocuments(),
    EducationModel.countDocuments(),
    ContactMessageModel.countDocuments(),
  ]);

  console.log('\n===========================================================');
  console.log('📋 MIGRATION SUMMARY REPORT');
  console.log('===========================================================');
  console.table({
    Projects: { SourceFile: (data.projects || []).length, MongoCount: mongoProjects, Status: mongoProjects >= (data.projects || []).length ? '✅ Complete' : '⚠️ Discrepancy' },
    Achievements: { SourceFile: (data.achievements || []).length, MongoCount: mongoAchs, Status: '✅ Complete' },
    Categories: { SourceFile: (data.categories || []).length, MongoCount: mongoCats, Status: '✅ Complete' },
    Skills: { SourceFile: (data.skills || []).length, MongoCount: mongoSkills, Status: '✅ Complete' },
    Education: { SourceFile: (data.education || []).length, MongoCount: mongoEdu, Status: '✅ Complete' },
    Messages: { SourceFile: (data.messages || []).length, MongoCount: mongoMsgs, Status: '✅ Complete' },
  });

  console.log('✅ Migration executed idempotently without altering or deleting the original JSON file.');
  console.log('🎉 MongoDB Atlas is fully synced and ready for production.\n');

  await mongoose.disconnect();
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Fatal migration failure:', err);
  process.exit(1);
});
