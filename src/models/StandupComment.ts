import { Schema, model, Document, Types } from 'mongoose';

export interface IStandupComment extends Document {
  _id: Types.ObjectId;
  standupId: Types.ObjectId;
  userId: Types.ObjectId;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const standupCommentSchema = new Schema<IStandupComment>(
  {
    standupId: { type: Schema.Types.ObjectId, ref: 'Standup', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const StandupComment = model<IStandupComment>('StandupComment', standupCommentSchema);
