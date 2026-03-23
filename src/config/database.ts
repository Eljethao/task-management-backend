import mongoose from 'mongoose';

// Cache the connection across serverless invocations (Vercel)
let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = {
  conn: null,
  promise: null,
};

export const connectDB = async (): Promise<void> => {
  if (cached.conn) return;

  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/task-management';

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
    console.info('MongoDB connected successfully');
  } catch (error) {
    cached.promise = null;
    console.error('MongoDB connection error:', error);
    throw error;
  }
};
