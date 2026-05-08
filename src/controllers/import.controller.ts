import { Response, NextFunction, RequestHandler } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { importSheet, parseSheet } from '../lib/excelImporter';

export const uploadXlsx: RequestHandler = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.toLowerCase().endsWith('.xlsx')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed'));
    }
  },
}).single('file');

const previewBodySchema = z.object({
  sheetName: z.string().min(1),
});

export const listSheets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
    if (!file) return next(new AppError('No file uploaded', 400));
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(file.buffer);
    const sheets = wb.worksheets.map((ws) => ({
      name: ws.name,
      rowCount: ws.rowCount,
    }));
    res.json({ success: true, data: { sheets } });
  } catch (err) {
    next(err);
  }
};

export const previewSheet = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
    if (!file) return next(new AppError('No file uploaded', 400));
    const { sheetName } = previewBodySchema.parse(req.body);
    const { blocks } = await parseSheet(file.buffer, sheetName);
    const totals = blocks.reduce((sum, b) => sum + b.tasks.length, 0);
    const employees = new Set<string>();
    const teams = new Set<string>();
    const projects = new Set<string>();
    blocks.forEach((b) =>
      b.tasks.forEach((t) => {
        if (t.employee) employees.add(t.employee);
        if (t.team) teams.add(t.team);
        if (t.project) projects.add(t.project);
      })
    );
    res.json({
      success: true,
      data: {
        sheetName,
        blocks: blocks.map((b) => ({ weekLabel: b.weekLabel, weekNumber: b.weekNumber, taskCount: b.tasks.length })),
        totalTasks: totals,
        employees: [...employees],
        teams: [...teams],
        projects: [...projects],
      },
    });
  } catch (err) {
    next(err);
  }
};

const importBodySchema = z.object({
  sheetName: z.string().min(1),
  employeeMap: z.record(z.string(), z.string()).optional(),
  teamMap: z.record(z.string(), z.string()).optional(),
  projectMap: z.record(z.string(), z.string()).optional(),
});

export const runImport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
    if (!file) return next(new AppError('No file uploaded', 400));
    if (!req.user?.userId) return next(new AppError('Unauthorized', 401));

    // Body comes as multipart fields — JSON-encoded for the maps.
    const rawBody = req.body as Record<string, string>;
    const body = importBodySchema.parse({
      sheetName: rawBody.sheetName,
      employeeMap: rawBody.employeeMap ? JSON.parse(rawBody.employeeMap) : undefined,
      teamMap: rawBody.teamMap ? JSON.parse(rawBody.teamMap) : undefined,
      projectMap: rawBody.projectMap ? JSON.parse(rawBody.projectMap) : undefined,
    });

    const report = await importSheet(file.buffer, body.sheetName, {
      employeeMap: body.employeeMap,
      teamMap: body.teamMap,
      projectMap: body.projectMap,
      reporterId: req.user.userId,
    });

    res.json({ success: true, data: { report } });
  } catch (err) {
    next(err);
  }
};
