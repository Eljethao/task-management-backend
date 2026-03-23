import { Schema, model, Document, Types } from 'mongoose';
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

const projectDocumentSchema = new Schema<IProjectDocument>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'],
      default: 'Planning',
      index: true,
    },
    targetDate: { type: Date, required: true },
    internalTestDate: { type: Date, default: null },
    uatDate: { type: Date, default: null },
    productionDate: { type: Date, default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    logoUrl: { type: String, default: null },
    documents: { type: [projectDocumentSchema], default: [] },
  },
  { timestamps: true }
);

export const Project = model<IProject>('Project', projectSchema);
