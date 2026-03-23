import { Router, IRouter } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  reorderTasks,
} from '../controllers/task.controller';
import { authenticate, authorize } from '../middleware/auth';

const router: IRouter = Router();

router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', authorize('Admin', 'Project Manager', 'Developer', 'Lead Developer', 'Tester', 'UXUI'), createTask);
router.patch('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/reorder', authorize('Admin', 'Project Manager', 'Developer', 'Lead Developer', 'Tester', 'UXUI'), reorderTasks);
router.delete('/:id', authorize('Admin', 'Project Manager'), deleteTask);

export default router;
