import { Schema, model, Document, Types } from 'mongoose';
import { TaskStatus, TaskPriority } from '../types';

export interface ITask extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  epicId?: Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: Types.ObjectId;
  reporterId: Types.ObjectId;
  storyPoints?: number;
  tags: string[];
  startDate?: Date;
  endDate?: Date;
  githubPrLink?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    epicId: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Code Review', 'Testing', 'Done'],
      default: 'To Do',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storyPoints: { type: Number, min: 0, max: 100, default: null },
    tags: [{ type: String, trim: true }],
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    githubPrLink: { type: String, default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1, status: 1, order: 1 });
taskSchema.index({ assigneeId: 1, status: 1 });

export const Task = model<ITask>('Task', taskSchema);
