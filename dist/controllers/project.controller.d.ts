import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getProjects: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getProjectById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createProject: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProject: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteProject: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/** DELETE a single document from a project */
export declare const deleteProjectDocument: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=project.controller.d.ts.map