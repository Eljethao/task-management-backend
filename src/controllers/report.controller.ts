import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { exportWeeklyReport } from '../lib/excelExporter';

export const downloadWeeklyReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sprintId = String(req.query.sprintId ?? '');
    if (!sprintId) return next(new AppError('sprintId is required', 400));
    const buf = await exportWeeklyReport(sprintId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="weekly-report-${sprintId}.xlsx"`);
    res.send(Buffer.from(buf as ArrayBuffer));
  } catch (err) {
    next(err);
  }
};
