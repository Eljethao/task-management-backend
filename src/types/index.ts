import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'Admin' | 'Developer' | 'Project Manager' | 'Tester' | 'UXUI' | 'Lead Developer';

export type TaskStatus = 'To Do' | 'In Progress' | 'Code Review' | 'Testing' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type MongoId = Types.ObjectId;
