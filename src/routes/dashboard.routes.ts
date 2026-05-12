import { Router, IRouter } from 'express';
import { getDashboardMetrics, getProjectOverview, getTeamWorkload, getBlockers, getTopPerformers } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth';

const router: IRouter = Router();

router.use(authenticate);
router.use(authorize('Admin', 'Project Manager', 'Lead Team'));

router.get('/metrics', getDashboardMetrics);
router.get('/projects', getProjectOverview);
router.get('/workload', getTeamWorkload);
router.get('/blockers', getBlockers);
router.get('/top-performers', getTopPerformers);

export default router;
