import { Router, IRouter } from 'express';
import { authenticate } from '../middleware/auth';
import { downloadWeeklyReport } from '../controllers/report.controller';

const router: IRouter = Router();

router.use(authenticate);

router.get('/weekly.xlsx', downloadWeeklyReport);

export default router;
