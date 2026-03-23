"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Seed script — creates the root Admin account.
 * Usage: pnpm seed
 *
 * Reads MONGODB_URI from backend/.env automatically.
 * Safe to run multiple times — skips creation if the email already exists.
 */
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const ROOT_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@taskflow.com';
const ROOT_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456';
const ROOT_NAME = process.env.SEED_ADMIN_NAME ?? 'Root Admin';
async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set in .env');
        process.exit(1);
    }
    await mongoose_1.default.connect(uri);
    console.info('Connected to MongoDB');
    const existing = await User_1.User.findOne({ email: ROOT_EMAIL });
    if (existing) {
        console.info(`Admin account already exists: ${ROOT_EMAIL}`);
        await mongoose_1.default.disconnect();
        return;
    }
    await User_1.User.create({
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
    await mongoose_1.default.disconnect();
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map