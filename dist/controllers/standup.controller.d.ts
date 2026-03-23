import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getStandups: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getTodayStandup: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createStandup: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateStandup: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getStandupComments: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const addStandupComment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=standup.controller.d.ts.map