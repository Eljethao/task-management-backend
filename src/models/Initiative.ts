import { Schema, model, Document, Types } from 'mongoose';
import { InitiativeStatus } from '../types';

export interface IInitiativeNote {
  body: string;
  userId: Types.ObjectId;
  createdAt: Date;
}

export interface IInitiative extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  quarter: string;
  ownerId: Types.ObjectId;
  externalLink?: string | null;
  status: InitiativeStatus;
  progressNotes: IInitiativeNote[];
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<IInitiativeNote>(
  {
    body: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const initiativeSchema = new Schema<IInitiative>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    quarter: { type: String, required: true, trim: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    externalLink: { type: String, default: null },
    status: {
      type: String,
      enum: ['Planned', 'In Progress', 'Done', 'On Hold'],
      default: 'Planned',
      index: true,
    },
    progressNotes: { type: [noteSchema], default: [] },
  },
  { timestamps: true }
);

export const Initiative = model<IInitiative>('Initiative', initiativeSchema);
