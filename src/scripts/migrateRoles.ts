/**
 * Migration: rename "Lead Developer" → "Lead Team", fix See Vang's name,
 * and promote Lenglee, Noy, Khamphoy to "Lead Team".
 *
 * Usage: pnpm tsx src/scripts/migrateRoles.ts
 * Safe to re-run (no-ops if already applied).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';

async function migrate(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  // 1. Rename all "Lead Developer" roles → "Lead Team"
  const roleResult = await (User as any).updateMany(
    { role: 'Lead Developer' },
    { $set: { role: 'Lead Team' } },
  );
  console.log(`role "Lead Developer" → "Lead Team": ${roleResult.modifiedCount} updated`);

  // 2. Fix name Xi Vang → See Vang
  const nameResult = await User.updateOne(
    { email: 'xi.vang@taskflow.com' },
    { $set: { name: 'See Vang' } },
  );
  console.log(`name fix (xi.vang): ${nameResult.modifiedCount} updated`);

  // 3. Promote Lenglee, Noy, Khamphoy to "Lead Team" (idempotent)
  const promoteResult = await (User as any).updateMany(
    { email: { $in: ['lenglee@taskflow.com', 'noy@taskflow.com', 'khamphoy@taskflow.com'] } },
    { $set: { role: 'Lead Team' } },
  );
  console.log(`promote Lenglee/Noy/Khamphoy: ${promoteResult.modifiedCount} updated`);

  // Print final state for verification
  console.log('\nVerification — Lead Team accounts now in DB:');
  const leads = await User.find({ role: 'Lead Team' }, 'name email department').lean();
  for (const u of leads) {
    console.log(`  ${u.email.padEnd(36)} ${u.name} (${u.department})`);
  }

  await mongoose.disconnect();
  console.log('\nMigration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
