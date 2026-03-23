import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['Admin', 'Developer', 'Project Manager', 'Tester', 'UXUI', 'Lead Developer'],
      default: 'Developer',
      index: true,
    },
    department: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash as string);
};

userSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: unknown, ret: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete ret.passwordHash;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return ret;
  },
});

export const User = model<IUser>('User', userSchema);
