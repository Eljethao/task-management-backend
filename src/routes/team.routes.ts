import { Router, IRouter } from 'express';
import { getTeams, getTeamById, createTeam, updateTeam, deleteTeam } from '../controllers/team.controller';
import { authenticate, authorize } from '../middleware/auth';

const router: IRouter = Router();

router.use(authenticate);

router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/', authorize('Admin', 'Project Manager', 'Lead Team'), createTeam);
router.patch('/:id', authorize('Admin', 'Project Manager', 'Lead Team'), updateTeam);
router.delete('/:id', authorize('Admin', 'Project Manager', 'Lead Team'), deleteTeam);

export default router;
