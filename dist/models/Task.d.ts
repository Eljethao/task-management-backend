import { Document, Types } from 'mongoose';
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
export declare const Task: import("mongoose").Model<ITask, {}, {}, {}, Document<unknown, {}, ITask, {}, {}> & ITask & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Task.d.ts.map