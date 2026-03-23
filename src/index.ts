import 'dotenv/config';
import app from './app';
import { connectDB } from './config/database';

const PORT = process.env.PORT ?? 5000;

// Ensure DB is connected on every serverless invocation
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Local / traditional server — not used by Vercel
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.info(`Server running on port ${PORT} in ${process.env.NODE_ENV ?? 'development'} mode`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}

// Vercel serverless export
export default app;
