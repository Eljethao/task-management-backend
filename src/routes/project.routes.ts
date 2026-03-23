import { Router, IRouter } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  deleteProjectDocument,
} from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth';
import { uploadProjectFiles } from '../middleware/upload';

const router: IRouter = Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', authorize('Admin', 'Project Manager'), uploadProjectFiles, createProject);
router.patch('/:id', authorize('Admin', 'Project Manager'), uploadProjectFiles, updateProject);
router.delete('/:id/documents/:docUrl', authorize('Admin', 'Project Manager'), deleteProjectDocument);
router.delete('/:id', authorize('Admin', 'Project Manager'), deleteProject);

export default router;
