import 'dotenv/config';
import { hashPassword } from '../server/auth.ts';
import { connectMongo, AdminModel, isMongoActive } from '../server/db/mongo.ts';
import { getDatabase, saveDatabase } from '../server/db/db-local.ts';

async function resetAdmin() {
  const args = process.argv.slice(2);
  const username = args[0] || process.env.ADMIN_USERNAME || 'admin';
  const newPassword = args[1] || process.env.ADMIN_PASSWORD;

  console.log('===========================================================');
  console.log('🔐 ADMIN CREDENTIAL RESET UTILITY');
  console.log('===========================================================');

  if (!newPassword) {
    console.error('❌ Error: New password was not specified.');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/reset-admin.ts <username> <newPassword>');
    console.log('Or set ADMIN_USERNAME and ADMIN_PASSWORD in environment variables and run:');
    console.log('  npm run reset-admin\n');
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error('❌ Error: Password must be at least 6 characters long.');
    process.exit(1);
  }

  const { hash, salt } = hashPassword(newPassword);
  const now = new Date().toISOString();

  // Try Mongo first if URI is provided
  if (process.env.MONGODB_URI) {
    try {
      const connected = await connectMongo();
      if (connected && isMongoActive()) {
        await AdminModel.updateOne(
          { username },
          { $set: { username, passwordHash: hash, salt, updatedAt: now } },
          { upsert: true }
        );
        console.log(`✅ [MONGODB] Admin credentials for '${username}' updated successfully in MongoDB Atlas.`);
      }
    } catch (err: any) {
      console.warn('⚠️ Could not update MongoDB:', err.message);
    }
  }

  // Also update local db.json
  try {
    const db = getDatabase();
    db.admin = {
      id: db.admin?.id || 'admin-1',
      username,
      passwordHash: hash,
      salt,
      updatedAt: now,
    };
    saveDatabase(db);
    console.log(`✅ [LOCAL JSON] Admin credentials for '${username}' updated in data/db.json.`);
  } catch (err: any) {
    console.error('❌ Could not update local db.json:', err.message);
  }

  console.log('\n🎉 Password reset completed successfully.');
  console.log(`Username: ${username}`);
  console.log(`New password set securely using scrypt with a 16-byte cryptographic salt.\n`);
  process.exit(0);
}

resetAdmin().catch(err => {
  console.error('Fatal reset error:', err);
  process.exit(1);
});
