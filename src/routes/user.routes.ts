import { Router, IRouter } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser, reactivateUser } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';

const router: IRouter = Router();

router.use(authenticate);

router.get('/', getUsers);
router.post('/', authorize('Admin', 'Project Manager'), createUser);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.patch('/:id/reactivate', authorize('Admin', 'Project Manager'), reactivateUser);
router.delete('/:id', authorize('Admin', 'Project Manager'), deleteUser);

export default router;
