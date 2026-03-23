import { Document, Types } from 'mongoose';
import { ProjectStatus } from '../types';
export interface IProjectDocument {
    name: string;
    url: string;
    mimetype: string;
    size: number;
    uploadedAt: Date;
}
export interface IProject extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    status: ProjectStatus;
    targetDate: Date;
    internalTestDate?: Date;
    uatDate?: Date;
    productionDate?: Date;
    ownerId: Types.ObjectId;
    memberIds: Types.ObjectId[];
    logoUrl?: string;
    documents: IProjectDocument[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Project: import("mongoose").Model<IProject, {}, {}, {}, Document<unknown, {}, IProject, {}, {}> & IProject & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Project.d.ts.map