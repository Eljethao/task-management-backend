import { Router, IRouter } from 'express';
import { authenticate } from '../middleware/auth';
import { downloadWeeklyReport, getMonthlyReport, downloadMonthlyReport } from '../controllers/report.controller';

const router: IRouter = Router();

router.use(authenticate);

router.get('/weekly.xlsx',  downloadWeeklyReport);
router.get('/monthly',      getMonthlyReport);
router.get('/monthly.xlsx', downloadMonthlyReport);

export default router;
