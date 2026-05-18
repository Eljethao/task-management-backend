import ExcelJS from 'exceljs';
import { Sprint } from '../models/Sprint';
import { Team } from '../models/Team';
import { Task } from '../models/Task';
import { TaskStatus, BlockedReason } from '../types';

const STATUS_LAO: Record<TaskStatus, string> = {
  'To Do': 'ຕ້ອງເຮັດ',
  'In Progress': 'ກຳລັງເຮັດ',
  'Testing': 'ລໍຖ້າກວດສອບ',
  'Done': 'ເຮັດສຳເລັດ',
};

const BLOCKED_LAO: Record<BlockedReason, string> = {
  'Waiting for API': 'ລໍຖ້າApi',
  'Waiting for Confirmation': 'ລໍຖ້າຄອນເຟີມ',
  'Tracking': 'ຕິດຕາມ',
  'Postponed': 'ເລືອນ',
  'Continue Next Week': 'ສືບຕໍ່ອາທິດໜ້າ',
  'Waiting': 'ລໍຖ້າ',
};

interface PopulatedAssignee { _id: { toString(): string }; name: string }
interface PopulatedProject { _id: { toString(): string }; name: string }
interface PopulatedTeam { _id: { toString(): string }; name: string }

/**
 * Produce an .xlsx in the same shape as the team's Lao "ເດືອນ MM/YYYY" sheets.
 * Hierarchy: Week → Team → Employee → Project → tasks.
 */
export async function exportWeeklyReport(sprintId: string): Promise<ExcelJS.Buffer> {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) throw new Error('Sprint not found');
  const team = sprint.teamId ? await Team.findById(sprint.teamId) : null;

  const taskFilter: Record<string, unknown> = { sprintId: sprint._id };
  if (sprint.teamId) taskFilter.teamId = sprint.teamId;
  const tasks = await Task.find(taskFilter)
    .populate('assigneeId', 'name')
    .populate('projectId', 'name')
    .populate('teamId', 'name')
    .sort({ teamId: 1, assigneeId: 1, projectId: 1 });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'TaskFlow';
  wb.created = new Date();

  const sheetName = `Week_${sprint.weekNumber}`;
  const ws = wb.addWorksheet(sheetName);

  ws.columns = [
    { width: 22 },  // A: team / week / employee
    { width: 22 },  // B: employee
    { width: 30 },  // C: project / topic
    { width: 60 },  // D: task title
    { width: 12 },  // E: priority level
    { width: 14 },  // F: start date
    { width: 14 },  // G: end date
    { width: 18 },  // H: status (Lao)
    { width: 14 },  // I: on time
    { width: 30 },  // J: notes
  ];

  ws.addRow([
    null,
    'ລາຍຊື່ພະນັກງານ',
    'ຫົວຂໍ້',
    'ໜ້າວຽກປະຈຳອາທິດ',
    'ລະດັບຄວາມສຳຄັນ',
    'ວັນທີເລີ່ມ',
    'ວັນທີສຳເລັດ',
    'ສະຖານະ',
    'Project On Time',
    'ໝາຍເຫດ',
  ]).font = { bold: true };

  ws.addRow([]);
  ws.addRow([`Week_${sprint.weekNumber} : ${formatRange(sprint.startDate, sprint.endDate)}`]).font = { bold: true };

  // Group: team → employee → project → tasks
  const byTeam = new Map<string, { teamName: string; byEmployee: Map<string, { name: string; byProject: Map<string, { name: string; tasks: typeof tasks }> }> }>();
  for (const tk of tasks) {
    const tm = (tk.teamId as unknown as PopulatedTeam | null);
    const a = tk.assigneeId as unknown as PopulatedAssignee | null;
    const p = tk.projectId as unknown as PopulatedProject | null;
    if (!a || !p) continue;
    const teamKey = tm?._id.toString() ?? '__none__';
    const teamName = tm?.name ?? team?.name ?? '';
    if (!byTeam.has(teamKey)) {
      byTeam.set(teamKey, { teamName, byEmployee: new Map() });
    }
    const teamEntry = byTeam.get(teamKey)!;
    const empKey = a._id.toString();
    if (!teamEntry.byEmployee.has(empKey)) {
      teamEntry.byEmployee.set(empKey, { name: a.name, byProject: new Map() });
    }
    const empEntry = teamEntry.byEmployee.get(empKey)!;
    const projKey = p._id.toString();
    if (!empEntry.byProject.has(projKey)) {
      empEntry.byProject.set(projKey, { name: p.name, tasks: [] as typeof tasks });
    }
    empEntry.byProject.get(projKey)!.tasks.push(tk);
  }

  for (const teamEntry of byTeam.values()) {
    if (teamEntry.teamName) {
      const r = ws.addRow([teamEntry.teamName]);
      r.font = { bold: true, color: { argb: 'FF1F4E79' } };
    }
    for (const emp of teamEntry.byEmployee.values()) {
      const r = ws.addRow([null, emp.name]);
      r.font = { bold: true };
      for (const proj of emp.byProject.values()) {
        ws.addRow([null, null, proj.name]);
        for (const tk of proj.tasks) {
          const status = tk.blockedReason
            ? BLOCKED_LAO[tk.blockedReason]
            : STATUS_LAO[tk.status];
          ws.addRow([
            null,
            null,
            null,
            `- ${tk.title}`,
            tk.priorityLevel ?? null,
            tk.startDate ?? null,
            tk.endDate ?? null,
            status,
            null,
            tk.notes ?? null,
          ]);
        }
      }
    }
  }

  return wb.xlsx.writeBuffer();
}

function formatRange(start: Date, end: Date): string {
  const d1 = String(start.getUTCDate()).padStart(2, '0');
  const d2 = String(end.getUTCDate()).padStart(2, '0');
  const y = end.getUTCFullYear();
  return `${d1}-${d2}/${y}`;
}
