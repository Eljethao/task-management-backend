import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getDashboardMetrics: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getProjectOverview: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getTeamWorkload: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getBlockers: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=dashboard.controller.d.ts.map