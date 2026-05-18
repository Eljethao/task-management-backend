/**
 * Migration: rename task status "Code Review" → "Testing".
 *
 * Usage: pnpm tsx src/scripts/migrateCodeReview.ts
 * Safe to re-run (no-ops if already applied).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { Task } from '../models/Task';

async function migrate(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const result = await (Task as any).updateMany(
    { status: 'Code Review' },
    { $set: { status: 'Testing' } },
  );
  console.log(`status "Code Review" → "Testing": ${result.modifiedCount} updated`);

  await mongoose.disconnect();
  console.log('\nMigration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
