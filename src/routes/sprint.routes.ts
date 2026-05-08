import { Router, IRouter } from 'express';
import {
  getSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  getWeeklyReport,
} from '../controllers/sprint.controller';
import { authenticate, authorize } from '../middleware/auth';

const router: IRouter = Router();

router.use(authenticate);

router.get('/report/weekly', getWeeklyReport);
router.get('/', getSprints);
router.post('/', authorize('Admin', 'Project Manager'), createSprint);
router.patch('/:id', authorize('Admin', 'Project Manager'), updateSprint);
router.delete('/:id', authorize('Admin'), deleteSprint);

export default router;
