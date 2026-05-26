import { Schema, model, Document, Types } from 'mongoose';

export interface ISubTask {
  title: string;
  description?: string;
  assigned?: string;
  startMonth?: number | null;
  endMonth?: number | null;
}

export interface IPlanTask {
  number?: string;
  title: string;
  description?: string;
  assigned?: string;
  startMonth?: number | null;
  endMonth?: number | null;
  subtasks: ISubTask[];
}

export interface IPhase {
  phaseName: string;
  phaseLabel?: string;
  tasks: IPlanTask[];
}

export interface IImplementationPlan extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  totalMonths: number;
  phases: IPhase[];
  createdAt: Date;
  updatedAt: Date;
}

const subTaskSchema = new Schema<ISubTask>(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assigned:    { type: String, default: '' },
    startMonth:  { type: Number, default: null },
    endMonth:    { type: Number, default: null },
  },
  { _id: false }
);

const planTaskSchema = new Schema<IPlanTask>(
  {
    number:      { type: String, default: '' },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assigned:    { type: String, default: '' },
    startMonth:  { type: Number, default: null },
    endMonth:    { type: Number, default: null },
    subtasks:    { type: [subTaskSchema], default: [] },
  },
  { _id: false }
);

const phaseSchema = new Schema<IPhase>(
  {
    phaseName:  { type: String, required: true, trim: true },
    phaseLabel: { type: String, default: '' },
    tasks:      { type: [planTaskSchema], default: [] },
  },
  { _id: false }
);

const implementationPlanSchema = new Schema<IImplementationPlan>(
  {
    projectId:   { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title:       { type: String, required: true, trim: true },
    totalMonths: { type: Number, default: 12, min: 1, max: 36 },
    phases:      { type: [phaseSchema], default: [] },
  },
  { timestamps: true }
);

export const ImplementationPlan = model<IImplementationPlan>('ImplementationPlan', implementationPlanSchema);
