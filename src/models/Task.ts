import { Schema, model, Document, Types } from 'mongoose';
import { TaskStatus, TaskPriority, BlockedReason, BLOCKED_REASONS, PriorityLevel } from '../types';

export interface ITask extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  epicId?: Types.ObjectId;
  teamId?: Types.ObjectId;
  sprintId?: Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  priorityLevel?: PriorityLevel;
  blockedReason?: BlockedReason | null;
  assigneeId?: Types.ObjectId;
  reporterId: Types.ObjectId;
  storyPoints?: number;
  tags: string[];
  startDate?: Date;
  endDate?: Date;
  completedAt?: Date | null;
  githubPrLink?: string;
  notes?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    epicId: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    sprintId: { type: Schema.Types.ObjectId, ref: 'Sprint', default: null, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Testing', 'Done'],
      default: 'To Do',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    priorityLevel: { type: Number, enum: [1, 2, 3], default: null },
    blockedReason: { type: String, enum: [...BLOCKED_REASONS, null], default: null, index: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storyPoints: { type: Number, min: 0, max: 100, default: null },
    tags: [{ type: String, trim: true }],
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    githubPrLink: { type: String, default: null },
    notes: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1, status: 1, order: 1 });
taskSchema.index({ assigneeId: 1, status: 1 });
taskSchema.index({ sprintId: 1, assigneeId: 1 });

taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'Done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'Done') {
      this.completedAt = null;
    }
  }
  next();
});

export const Task = model<ITask>('Task', taskSchema);
