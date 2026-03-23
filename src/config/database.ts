import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/task-management';

  try {
    await mongoose.connect(uri);
    console.info('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
};
