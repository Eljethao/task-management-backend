export type ReportPreset =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear';

export const VALID_PRESETS: ReportPreset[] = [
  'today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisYear',
];

export function resolvePresetRange(preset: ReportPreset): { start: Date; end: Date } {
  const now = new Date();

  const sob = (d: Date): Date => { d.setHours(0, 0, 0, 0); return d; };
  const eob = (d: Date): Date => { d.setHours(23, 59, 59, 999); return d; };

  switch (preset) {
    case 'today':
      return { start: sob(new Date()), end: eob(new Date()) };

    case 'yesterday': {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return { start: sob(y), end: eob(new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999)) };
    }

    case 'thisWeek': {
      const start = new Date(now);
      const day = now.getDay() === 0 ? 6 : now.getDay() - 1; // offset to Monday
      start.setDate(now.getDate() - day);
      return { start: sob(start), end: eob(new Date()) };
    }

    case 'lastWeek': {
      const start = new Date(now);
      const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
      start.setDate(now.getDate() - day - 7); // Monday of last week
      const end = new Date(start);
      end.setDate(start.getDate() + 6);       // Sunday of last week
      return { start: sob(start), end: eob(end) };
    }

    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: sob(start), end: eob(new Date()) };
    }

    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0); // last day of prev month
      return { start: sob(start), end: eob(end) };
    }

    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start: sob(start), end: eob(new Date()) };
    }
  }
}
