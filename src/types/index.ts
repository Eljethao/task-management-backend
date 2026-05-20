import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'Admin' | 'Developer' | 'Project Manager' | 'Tester' | 'UXUI' | 'Lead Team' | 'Sale' | 'Marketing' | 'Office' | 'Finance' | 'HR';

export type TaskStatus = 'To Do' | 'In Progress' | 'Testing' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type BlockedReason =
  | 'Waiting for API'
  | 'Waiting for Confirmation'
  | 'Tracking'
  | 'Postponed'
  | 'Continue Next Week'
  | 'Waiting';

export const BLOCKED_REASONS: BlockedReason[] = [
  'Waiting for API',
  'Waiting for Confirmation',
  'Tracking',
  'Postponed',
  'Continue Next Week',
  'Waiting',
];

export type PriorityLevel = 1 | 2 | 3;

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived';

export type InitiativeStatus = 'Planned' | 'In Progress' | 'Done' | 'On Hold';

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
