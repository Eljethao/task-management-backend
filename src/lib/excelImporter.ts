import ExcelJS from 'exceljs';
import { Types } from 'mongoose';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { Team } from '../models/Team';
import { Sprint } from '../models/Sprint';
import { User } from '../models/User';
import { TaskStatus, TaskPriority, BlockedReason, PriorityLevel } from '../types';

/**
 * Maps the Lao status text used in the team's spreadsheet to our internal
 * (status, blockedReason) pair. Same Lao value can mean either a lifecycle
 * state or a "waiting for X" reason — only the second resets blockedReason.
 */
const STATUS_MAP: Record<string, { status: TaskStatus; blockedReason: BlockedReason | null }> = {
  'ເຮັດສຳເລັດ':       { status: 'Done',        blockedReason: null },
  'ກຳລັງເຮັດ':         { status: 'In Progress', blockedReason: null },
  'ຕ້ອງເຮັດ':           { status: 'To Do',       blockedReason: null },
  'ລໍຖ້າກວດສອບ':     { status: 'Testing',     blockedReason: null },
  'ຕິດຕາມ':            { status: 'In Progress', blockedReason: 'Tracking' },
  'ລໍຖ້າApi':           { status: 'In Progress', blockedReason: 'Waiting for API' },
  'ລໍຖ້າຄອນເຟີມ':   { status: 'In Progress', blockedReason: 'Waiting for Confirmation' },
  'ເລືອນ':              { status: 'To Do',       blockedReason: 'Postponed' },
  'ສືບຕໍ່ອາທິດໜ້າ': { status: 'In Progress', blockedReason: 'Continue Next Week' },
  'ລໍຖ້າ':              { status: 'In Progress', blockedReason: 'Waiting' },
};

const PRIORITY_LEVEL_MAP: Record<string, { level: PriorityLevel; named: TaskPriority }> = {
  '1': { level: 1, named: 'High' },
  '1.0': { level: 1, named: 'High' },
  '2': { level: 2, named: 'Medium' },
  '2.0': { level: 2, named: 'Medium' },
  '3': { level: 3, named: 'Low' },
  '3.0': { level: 3, named: 'Low' },
};

interface ParsedTask {
  team: string;
  employee: string;
  project: string;
  title: string;
  priorityLevelRaw?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: string;
  notes?: string;
}

interface WeekBlock {
  weekLabel: string;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  tasks: ParsedTask[];
}

interface ImportReport {
  sheet: string;
  weeks: { label: string; weekNumber: number; tasksFound: number }[];
  unmatched: { employees: string[]; statuses: string[]; teams: string[]; projects: string[] };
  created: { teams: number; sprints: number; projects: number; tasks: number };
  skipped: number;
}

function parseWeekLabel(label: string, fallbackYear: number): { weekNumber: number; startDate: Date; endDate: Date } | null {
  // Examples: "Week_4 : 20-25/2026", "Week_2 : 06-10/2026"
  const m = /Week[_\s]*(\d+)\s*:\s*(\d{1,2})\s*-\s*(\d{1,2})\s*\/\s*(\d{4})/i.exec(label);
  if (!m) return null;
  const weekNumber = Number(m[1]);
  const dStart = Number(m[2]);
  const dEnd = Number(m[3]);
  const year = Number(m[4]) || fallbackYear;
  // The day range straddles week boundaries — best-effort: month is inferred
  // from the sheet name later. Caller substitutes the correct month.
  return {
    weekNumber,
    startDate: new Date(Date.UTC(year, 0, dStart)),
    endDate: new Date(Date.UTC(year, 0, dEnd)),
  };
}

function parseSheetMonth(sheetName: string): { month: number; year: number } | null {
  // Examples: "ເດືອນ 042026", "ເດືອນ 122025"
  const m = /(\d{2})(\d{4})/.exec(sheetName);
  if (!m) return null;
  return { month: Number(m[1]) - 1, year: Number(m[2]) };
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string') {
    const s = v.trim();
    // dd/mm/yyyy
    const m1 = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
    if (m1) return new Date(Date.UTC(Number(m1[3]), Number(m1[2]) - 1, Number(m1[1])));
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export async function parseSheet(buffer: Buffer, sheetName: string): Promise<{ blocks: WeekBlock[]; year: number; month: number }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet(sheetName);
  if (!ws) throw new Error(`Sheet not found: ${sheetName}`);

  const monthInfo = parseSheetMonth(sheetName);
  const fallbackYear = monthInfo?.year ?? new Date().getFullYear();
  const fallbackMonth = monthInfo?.month ?? new Date().getMonth();

  const blocks: WeekBlock[] = [];
  let currentBlock: WeekBlock | null = null;
  let currentTeam = '';
  let currentEmployee = '';
  let currentProject = '';

  ws.eachRow((row, rIdx) => {
    if (rIdx === 1) return; // header

    const a = (row.getCell(1).value ?? '').toString().trim();
    const b = (row.getCell(2).value ?? '').toString().trim();
    const c = (row.getCell(3).value ?? '').toString().trim();
    const dCell = row.getCell(4).value;
    const d = (dCell ?? '').toString().trim();
    const e = row.getCell(5).value;
    const fStart = row.getCell(6).value;
    const gEnd = row.getCell(7).value;
    const hStatus = (row.getCell(8).value ?? '').toString().trim();
    const jNotes = (row.getCell(10)?.value ?? '').toString().trim();

    // Week marker (col A starts with "Week")
    if (/^Week[_\s]/i.test(a)) {
      const parsed = parseWeekLabel(a, fallbackYear);
      if (parsed) {
        const startDate = new Date(Date.UTC(fallbackYear, fallbackMonth, parsed.startDate.getUTCDate()));
        const endDate = new Date(Date.UTC(fallbackYear, fallbackMonth, parsed.endDate.getUTCDate()));
        currentBlock = {
          weekLabel: a,
          weekNumber: parsed.weekNumber,
          startDate,
          endDate,
          tasks: [],
        };
        blocks.push(currentBlock);
        currentTeam = '';
        currentEmployee = '';
        currentProject = '';
      }
      return;
    }

    // Team marker (col A only)
    if (a && !b && !c && !d) {
      currentTeam = a;
      currentEmployee = '';
      currentProject = '';
      return;
    }

    // Employee marker (col B only)
    if (b && !c && !d) {
      currentEmployee = b;
      currentProject = '';
      return;
    }

    // Project marker (col C with no D)
    if (c && !d) {
      currentProject = c;
      return;
    }

    // Sub-task row: col D has content
    if (d && currentBlock && currentEmployee && currentProject) {
      const priorityLevelRaw = e == null ? '' : String(e).trim();
      currentBlock.tasks.push({
        team: currentTeam,
        employee: currentEmployee,
        project: currentProject,
        title: d.replace(/^[-•·]\s*/, '').trim(),
        priorityLevelRaw,
        startDate: toDate(fStart),
        endDate: toDate(gEnd),
        status: hStatus,
        notes: jNotes || undefined,
      });
    }
  });

  return { blocks, year: fallbackYear, month: fallbackMonth };
}

export async function importSheet(
  buffer: Buffer,
  sheetName: string,
  options: {
    employeeMap?: Record<string, string>; // sheet name → user._id
    teamMap?: Record<string, string>;     // sheet name → team._id
    projectMap?: Record<string, string>;  // sheet name → project._id
    reporterId: string;
  }
): Promise<ImportReport> {
  const { blocks, year } = await parseSheet(buffer, sheetName);

  const employeeMap = options.employeeMap ?? {};
  const teamMap = options.teamMap ?? {};
  const projectMap = options.projectMap ?? {};

  const report: ImportReport = {
    sheet: sheetName,
    weeks: [],
    unmatched: { employees: [], statuses: [], teams: [], projects: [] },
    created: { teams: 0, sprints: 0, projects: 0, tasks: 0 },
    skipped: 0,
  };

  const allUsers = await User.find({ isActive: true }).lean();
  const allTeams = await Team.find().lean();
  const allProjects = await Project.find().lean();

  const userByName = new Map<string, string>();
  allUsers.forEach((u) => userByName.set(u.name.trim(), u._id.toString()));
  const teamByName = new Map<string, string>();
  allTeams.forEach((tm) => teamByName.set(tm.name.trim(), tm._id.toString()));
  const projectByName = new Map<string, string>();
  allProjects.forEach((p) => projectByName.set(p.name.trim(), p._id.toString()));

  for (const block of blocks) {
    report.weeks.push({ label: block.weekLabel, weekNumber: block.weekNumber, tasksFound: block.tasks.length });

    // Resolve unique team set in this block
    const teamsInBlock = new Set(block.tasks.map((t) => t.team).filter(Boolean));
    const teamIdByLabel = new Map<string, Types.ObjectId | null>();

    for (const teamLabel of teamsInBlock) {
      const explicit = teamMap[teamLabel];
      if (explicit) {
        teamIdByLabel.set(teamLabel, new Types.ObjectId(explicit));
        continue;
      }
      const existing = teamByName.get(teamLabel);
      if (existing) {
        teamIdByLabel.set(teamLabel, new Types.ObjectId(existing));
        continue;
      }
      // Auto-create team
      const created = await Team.create({ name: teamLabel });
      teamByName.set(teamLabel, created._id.toString());
      teamIdByLabel.set(teamLabel, created._id);
      report.created.teams += 1;
    }

    // Sprint per team
    const sprintIdByTeam = new Map<string, Types.ObjectId>();
    const noTeamSprintKey = '__none__';
    for (const teamLabel of [...teamsInBlock, noTeamSprintKey]) {
      const teamObjectId = teamLabel === noTeamSprintKey ? null : teamIdByLabel.get(teamLabel) ?? null;
      const filter: Record<string, unknown> = {
        weekNumber: block.weekNumber,
        year,
        teamId: teamObjectId,
      };
      let sprint = await Sprint.findOne(filter);
      if (!sprint) {
        sprint = await Sprint.create({
          name: `${block.weekLabel} ${teamLabel === noTeamSprintKey ? '' : `· ${teamLabel}`}`.trim(),
          weekNumber: block.weekNumber,
          year,
          startDate: block.startDate,
          endDate: block.endDate,
          teamId: teamObjectId,
          isActive: true,
        });
        report.created.sprints += 1;
      }
      sprintIdByTeam.set(teamLabel, sprint._id);
    }

    // Resolve unique project set
    const projectsInBlock = new Set(block.tasks.map((t) => t.project).filter(Boolean));
    const projectIdByLabel = new Map<string, Types.ObjectId>();
    for (const projLabel of projectsInBlock) {
      const explicit = projectMap[projLabel];
      if (explicit) {
        projectIdByLabel.set(projLabel, new Types.ObjectId(explicit));
        continue;
      }
      const existing = projectByName.get(projLabel);
      if (existing) {
        projectIdByLabel.set(projLabel, new Types.ObjectId(existing));
        continue;
      }
      // Auto-create with sensible defaults
      const created = await Project.create({
        name: projLabel,
        description: `Auto-created from import: ${sheetName}`,
        status: 'Active',
        targetDate: block.endDate,
        ownerId: new Types.ObjectId(options.reporterId),
        memberIds: [],
      });
      projectByName.set(projLabel, created._id.toString());
      projectIdByLabel.set(projLabel, created._id);
      report.created.projects += 1;
    }

    // Tasks
    for (const tk of block.tasks) {
      const employeeId = employeeMap[tk.employee] ?? userByName.get(tk.employee);
      if (!employeeId) {
        if (!report.unmatched.employees.includes(tk.employee)) report.unmatched.employees.push(tk.employee);
        report.skipped += 1;
        continue;
      }

      const statusInfo = tk.status ? STATUS_MAP[tk.status] : { status: 'To Do' as TaskStatus, blockedReason: null };
      if (tk.status && !STATUS_MAP[tk.status] && !report.unmatched.statuses.includes(tk.status)) {
        report.unmatched.statuses.push(tk.status);
      }

      const prio = PRIORITY_LEVEL_MAP[tk.priorityLevelRaw ?? ''];
      const teamObjectId = teamIdByLabel.get(tk.team) ?? null;
      const sprintObjectId = sprintIdByTeam.get(tk.team) ?? sprintIdByTeam.get('__none__') ?? null;
      const projectObjectId = projectIdByLabel.get(tk.project);
      if (!projectObjectId) {
        report.skipped += 1;
        continue;
      }

      // Idempotency: same project + assignee + sprint + title
      const existing = await Task.findOne({
        projectId: projectObjectId,
        sprintId: sprintObjectId,
        assigneeId: employeeId,
        title: tk.title,
      });
      if (existing) {
        existing.status = statusInfo?.status ?? existing.status;
        existing.blockedReason = statusInfo?.blockedReason ?? null;
        if (prio) {
          existing.priorityLevel = prio.level;
          existing.priority = prio.named;
        }
        if (tk.startDate) existing.startDate = tk.startDate;
        if (tk.endDate) existing.endDate = tk.endDate;
        if (tk.notes) existing.notes = tk.notes;
        existing.teamId = teamObjectId ?? undefined;
        await existing.save();
        continue;
      }

      await Task.create({
        title: tk.title,
        description: '',
        notes: tk.notes,
        projectId: projectObjectId,
        teamId: teamObjectId,
        sprintId: sprintObjectId,
        assigneeId: employeeId,
        reporterId: new Types.ObjectId(options.reporterId),
        status: statusInfo?.status ?? 'To Do',
        blockedReason: statusInfo?.blockedReason ?? null,
        priority: prio?.named ?? 'Medium',
        priorityLevel: prio?.level ?? null,
        startDate: tk.startDate ?? undefined,
        endDate: tk.endDate ?? undefined,
        tags: [],
      });
      report.created.tasks += 1;
    }
  }

  return report;
}
