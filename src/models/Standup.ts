import { Schema, model, Document, Types } from 'mongoose';

export interface IStandup extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  date: Date;
  title?: string;
  location?: string;
  attendees?: string;
  agenda?: string;
  yesterday: string;
  today: string;
  blockers: string;
  createdAt: Date;
  updatedAt: Date;
}

const standupSchema = new Schema<IStandup>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    date: { type: Date, required: true, index: true },
    title: { type: String, default: '' },
    location: { type: String, default: '' },
    attendees: { type: String, default: '' },
    agenda: { type: String, default: '' },
    yesterday: { type: String, default: '' }, // Legacy, used for Discussion
    today: { type: String, default: '' },     // Legacy, used for Action Items
    blockers: { type: String, default: '' },  // Legacy, used for Next Meeting
  },
  { timestamps: true }
);

// One standup per user per project per day
standupSchema.index({ userId: 1, projectId: 1, date: 1 }, { unique: true });

export const Standup = model<IStandup>('Standup', standupSchema);
