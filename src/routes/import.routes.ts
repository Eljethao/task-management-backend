import { Router, IRouter } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { uploadXlsx, listSheets, previewSheet, runImport } from '../controllers/import.controller';

const router: IRouter = Router();

router.use(authenticate);
router.use(authorize('Admin', 'Project Manager'));

router.post('/sheets', uploadXlsx, listSheets);
router.post('/preview', uploadXlsx, previewSheet);
router.post('/run', uploadXlsx, runImport);

export default router;
