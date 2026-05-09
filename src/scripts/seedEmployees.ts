/**
 * Seed script — creates all team member accounts from the Excel task sheet.
 * Usage: pnpm tsx src/scripts/seedEmployees.ts
 *
 * Safe to re-run: skips any email that already exists.
 * Default password for every account: Taskflow@123
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';

const PASSWORD = 'Taskflow@123';

const USERS = [
  // ── LJ (lead / overall manager) → Admin so they can see all teams ──────
  {
    name: 'LJ',
    email: 'lj@taskflow.com',
    role: 'Admin' as const,
    department: 'Engineering',
  },

  // ── The Rendering Crew ──────────────────────────────────────────────────
  {
    name: 'See Vang',         // ຊີ ວ່າງ
    email: 'xi.vang@taskflow.com',
    role: 'Lead Team' as const,
    department: 'The Rendering Crew',
  },
  {
    name: 'Hue Vang',         // ຫືວ່າງ
    email: 'hue.vang@taskflow.com',
    role: 'Developer' as const,
    department: 'The Rendering Crew',
  },
  {
    name: 'Bu',               // ບູ່
    email: 'bu@taskflow.com',
    role: 'Developer' as const,
    department: 'The Rendering Crew',
  },
  {
    name: 'Nok',              // ນົກ
    email: 'nok@taskflow.com',
    role: 'Developer' as const,
    department: 'The Rendering Crew',
  },

  // ── AI VIBE CHECK ───────────────────────────────────────────────────────
  {
    name: 'Sulichai Vilasid', // ສຸລິໄຊ ວິລະສິດ
    email: 'sulichai.vilasid@taskflow.com',
    role: 'Lead Team' as const,
    department: 'AI VIBE CHECK',
  },
  {
    name: 'Ong Lo',           // ອ້ອງລໍ່
    email: 'ong.lo@taskflow.com',
    role: 'Developer' as const,
    department: 'AI VIBE CHECK',
  },
  {
    name: 'Mebi',             // ເມບີ່
    email: 'mebi@taskflow.com',
    role: 'Developer' as const,
    department: 'AI VIBE CHECK',
  },
  {
    name: 'Ather',            // Ather (ເຢັງຮົ່ວວື)
    email: 'ather@taskflow.com',
    role: 'Developer' as const,
    department: 'AI VIBE CHECK',
  },
  {
    name: 'Dee Lakaew',       // Dee ຫລ້າແກ້ວ
    email: 'dee.lakaew@taskflow.com',
    role: 'Developer' as const,
    department: 'AI VIBE CHECK',
  },

  // ── UX/UI ───────────────────────────────────────────────────────────────
  {
    name: 'Khamphoy',         // ຄຳພອຍ
    email: 'khamphoy@taskflow.com',
    role: 'Lead Team' as const,
    department: 'UX/UI',
  },
  {
    name: 'Tatoon',           // ຕາຕຸ່ນ
    email: 'tatoon@taskflow.com',
    role: 'UXUI' as const,
    department: 'UX/UI',
  },
  {
    name: 'Khambo',           // ຄຳໂບ
    email: 'khambo@taskflow.com',
    role: 'UXUI' as const,
    department: 'UX/UI',
  },
  {
    name: 'Thong',            // ທອງ
    email: 'thong@taskflow.com',
    role: 'UXUI' as const,
    department: 'UX/UI',
  },
  {
    name: 'First',            // ເຟີສ
    email: 'first@taskflow.com',
    role: 'UXUI' as const,
    department: 'UX/UI',
  },

  // ── Tester ──────────────────────────────────────────────────────────────
  {
    name: 'Noy',
    email: 'noy@taskflow.com',
    role: 'Lead Team' as const,
    department: 'Testing',
  },
  {
    name: 'Somphout',         // ສົມພຸດ
    email: 'somphout@taskflow.com',
    role: 'Tester' as const,
    department: 'Testing',
  },

  // ── Backend ─────────────────────────────────────────────────────────────
  {
    name: 'Lenglee',          // ເລັ່ງລີ
    email: 'lenglee@taskflow.com',
    role: 'Lead Team' as const,
    department: 'Backend',
  },
  {
    name: 'Bounmy',           // ບຸນມີ
    email: 'bounmy@taskflow.com',
    role: 'Developer' as const,
    department: 'Backend',
  },
  {
    name: 'New',              // ນິວ
    email: 'new@taskflow.com',
    role: 'Developer' as const,
    department: 'Backend',
  },
  {
    name: 'Ayi',              // ອະຢີ
    email: 'ayi@taskflow.com',
    role: 'Developer' as const,
    department: 'Backend',
  },
];

async function seedEmployees(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  let created = 0;
  let skipped = 0;

  for (const u of USERS) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`  skip  ${u.email}  (already exists)`);
      skipped++;
      continue;
    }
    await User.create({ ...u, passwordHash: PASSWORD, isActive: true });
    console.log(`  ✓     ${u.email}  [${u.role}]  — ${u.name}`);
    created++;
  }

  console.log(`\nDone — created: ${created}, skipped: ${skipped}`);
  console.log(`\nAll new accounts use password: ${PASSWORD}`);
  console.log('\nAccount summary:');
  console.log('  lj@taskflow.com          → LJ (Admin — sees all teams)');
  console.log('  xi.vang@taskflow.com     → Xi Vang (The Rendering Crew)');
  console.log('  hue.vang@taskflow.com    → Hue Vang (The Rendering Crew)');
  console.log('  bu@taskflow.com          → Bu (The Rendering Crew)');
  console.log('  nok@taskflow.com         → Nok (The Rendering Crew)');
  console.log('  sulichai.vilasid@...     → Sulichai Vilasid (AI VIBE CHECK)');
  console.log('  ong.lo@taskflow.com      → Ong Lo (AI VIBE CHECK)');
  console.log('  mebi@taskflow.com        → Mebi (AI VIBE CHECK)');
  console.log('  ather@taskflow.com       → Ather (AI VIBE CHECK)');
  console.log('  dee.lakaew@taskflow.com  → Dee Lakaew (AI VIBE CHECK)');
  console.log('  khamphoy@taskflow.com    → Khamphoy (UX/UI)');
  console.log('  tatoon@taskflow.com      → Tatoon (UX/UI)');
  console.log('  khambo@taskflow.com      → Khambo (UX/UI)');
  console.log('  thong@taskflow.com       → Thong (UX/UI)');
  console.log('  first@taskflow.com       → First (UX/UI)');
  console.log('  noy@taskflow.com         → Noy (Tester)');
  console.log('  somphout@taskflow.com    → Somphout (Tester)');
  console.log('  lenglee@taskflow.com     → Lenglee (Backend)');
  console.log('  bounmy@taskflow.com      → Bounmy (Backend)');
  console.log('  new@taskflow.com         → New (Backend)');
  console.log('  ayi@taskflow.com         → Ayi (Backend)');

  await mongoose.disconnect();
}

seedEmployees().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
