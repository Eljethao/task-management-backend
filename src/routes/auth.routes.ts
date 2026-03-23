import { Router, IRouter } from 'express';
import { login, register, getMe, refreshToken } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router: IRouter = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.get('/test', (_req, res) => {
  res.json({ message: 'Auth route is working!' });
});

export default router;
