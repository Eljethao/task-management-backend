import { Router, IRouter } from 'express';
import { handleGithubWebhook, handleGitlabWebhook } from '../controllers/webhook.controller';

const router: IRouter = Router();

// Webhooks are authenticated via secret token in headers, not JWT
router.post('/github', handleGithubWebhook);
router.post('/gitlab', handleGitlabWebhook);

export default router;
