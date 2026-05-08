import { Router, IRouter } from 'express';
import {
  getInitiatives,
  createInitiative,
  updateInitiative,
  deleteInitiative,
  addNote,
} from '../controllers/initiative.controller';
import { authenticate, authorize } from '../middleware/auth';

const router: IRouter = Router();

router.use(authenticate);

router.get('/', getInitiatives);
router.post('/', authorize('Admin', 'Project Manager', 'Lead Developer'), createInitiative);
router.patch('/:id', authorize('Admin', 'Project Manager', 'Lead Developer'), updateInitiative);
router.delete('/:id', authorize('Admin'), deleteInitiative);
router.post('/:id/notes', addNote);

export default router;
