import 'dotenv/config';
import app from './app';
import { connectDB } from './config/database';

const PORT = process.env.PORT ?? 5000;

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.info(`Server running on port ${PORT} in ${process.env.NODE_ENV ?? 'development'} mode`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
