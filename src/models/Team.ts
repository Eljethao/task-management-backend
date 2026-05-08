import { Schema, model, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  leadId?: Types.ObjectId | null;
  memberIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, default: '' },
    leadId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const Team = model<ITeam>('Team', teamSchema);
