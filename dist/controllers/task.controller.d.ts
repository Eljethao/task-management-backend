import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getTasks: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getTaskById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createTask: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateTask: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateTaskStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const reorderTasks: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteTask: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=task.controller.d.ts.map