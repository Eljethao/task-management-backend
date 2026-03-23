import { Router, IRouter } from 'express';
import { login, register, getMe, refreshToken } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import dotenv from 'dotenv';

dotenv.config();

const router: IRouter = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.get('/test', (_req, res) => {
    console.log("DATABASE URI:", process.env.MONGODB_URI); // Debug log
  res.json({ message: 'Auth route is working!', databaseUri: process.env.MONGODB_URI });
});

export default router;
