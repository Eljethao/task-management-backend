import { Request, Response, NextFunction } from 'express';
import { Task } from '../models/Task';
import { AppError } from '../middleware/errorHandler';

// Parse task IDs from commit messages like "Fixes #123" or "Closes #456"
const extractTaskRefs = (message: string): string[] => {
  const pattern = /(?:fixes|closes|resolves)\s+#(\w+)/gi;
  const refs: string[] = [];
  let match;
  while ((match = pattern.exec(message)) !== null) {
    refs.push(match[1]);
  }
  return refs;
};

export const handleGithubWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers['x-hub-signature-256'];
      if (!signature) {
        return next(new AppError('Missing webhook signature', 401));
      }
      // In production, verify HMAC signature here
    }

    const event = req.headers['x-github-event'] as string;
    const payload = req.body as {
      action?: string;
      pull_request?: { html_url: string; merged: boolean; title: string };
      commits?: { message: string }[];
    };

    // Handle PR merge
    if (event === 'pull_request' && payload.action === 'closed' && payload.pull_request?.merged) {
      const prTitle = payload.pull_request.title;
      const taskRefs = extractTaskRefs(prTitle);

      for (const ref of taskRefs) {
        await Task.findByIdAndUpdate(ref, {
          status: 'Testing',
          githubPrLink: payload.pull_request.html_url,
        });
      }
    }

    // Handle push commits
    if (event === 'push' && payload.commits) {
      for (const commit of payload.commits) {
        const taskRefs = extractTaskRefs(commit.message);
        for (const ref of taskRefs) {
          await Task.findByIdAndUpdate(ref, { status: 'In Progress' });
        }
      }
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    next(err);
  }
};

export const handleGitlabWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const secret = process.env.GITLAB_WEBHOOK_SECRET;
    if (secret && req.headers['x-gitlab-token'] !== secret) {
      return next(new AppError('Invalid webhook token', 401));
    }

    const payload = req.body as {
      object_kind?: string;
      object_attributes?: { state: string; url: string; title: string };
      commits?: { message: string }[];
    };

    // Handle MR merge
    if (
      payload.object_kind === 'merge_request' &&
      payload.object_attributes?.state === 'merged'
    ) {
      const title = payload.object_attributes.title;
      const taskRefs = extractTaskRefs(title);

      for (const ref of taskRefs) {
        await Task.findByIdAndUpdate(ref, {
          status: 'Testing',
          githubPrLink: payload.object_attributes.url,
        });
      }
    }

    // Handle push
    if (payload.object_kind === 'push' && payload.commits) {
      for (const commit of payload.commits) {
        const taskRefs = extractTaskRefs(commit.message);
        for (const ref of taskRefs) {
          await Task.findByIdAndUpdate(ref, { status: 'In Progress' });
        }
      }
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    next(err);
  }
};
