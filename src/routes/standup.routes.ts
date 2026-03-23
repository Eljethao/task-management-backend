import { Router, IRouter } from 'express';
import {
  getStandups,
  getTodayStandup,
  createStandup,
  updateStandup,
  getStandupComments,
  addStandupComment,
} from '../controllers/standup.controller';
import { authenticate, authorize } from '../middleware/auth';

const router: IRouter = Router();

router.use(authenticate);

router.get('/', getStandups);
router.get('/today', getTodayStandup);
router.post('/', createStandup);
router.patch('/:id', updateStandup);

router.get('/:id/comments', getStandupComments);
router.post('/:id/comments', authorize('Admin', 'Project Manager'), addStandupComment);

export default router;
