import { Schema, model, Document, Types } from 'mongoose';

export interface ISprint extends Document {
  _id: Types.ObjectId;
  name: string;
  weekNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
  teamId?: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sprintSchema = new Schema<ISprint>(
  {
    name: { type: String, required: true, trim: true },
    weekNumber: { type: Number, required: true, min: 1, max: 53, index: true },
    year: { type: Number, required: true, min: 2020, max: 2100, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

sprintSchema.index({ year: 1, weekNumber: 1, teamId: 1 }, { unique: true });

export const Sprint = model<ISprint>('Sprint', sprintSchema);
