import { Router, IRouter } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} from '../controllers/implementationPlan.controller';

const router: IRouter = Router();

router.use(authenticate);

router.get('/',    getPlans);
router.get('/:id', getPlanById);
router.post('/',   createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

export default router;
