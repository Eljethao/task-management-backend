import { Router, IRouter } from 'express';
import { getDashboardMetrics, getProjectOverview, getTeamWorkload, getBlockers } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth';

const router: IRouter = Router();

router.use(authenticate);
router.use(authorize('Admin', 'Project Manager'));

router.get('/metrics', getDashboardMetrics);
router.get('/projects', getProjectOverview);
router.get('/workload', getTeamWorkload);
router.get('/blockers', getBlockers);

export default router;
