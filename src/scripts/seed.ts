/**
 * Seed script — creates the root Admin account.
 * Usage: pnpm seed
 *
 * Reads MONGODB_URI from backend/.env automatically.
 * Safe to run multiple times — skips creation if the email already exists.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';

const ROOT_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@taskflow.com';
const ROOT_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456';
const ROOT_NAME = process.env.SEED_ADMIN_NAME ?? 'Root Admin';

async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.info('Connected to MongoDB');

  const existing = await User.findOne({ email: ROOT_EMAIL });
  if (existing) {
    console.info(`Admin account already exists: ${ROOT_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: ROOT_NAME,
    email: ROOT_EMAIL,
    passwordHash: ROOT_PASSWORD, // pre-save hook will bcrypt this
    role: 'Admin',
    department: 'Engineering',
    isActive: true,
  });

  console.info('');
  console.info('Root Admin created successfully');
  console.info('  Email   :', ROOT_EMAIL);
  console.info('  Password:', ROOT_PASSWORD);
  console.info('');
  console.info('Change the password after first login!');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
