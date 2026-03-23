"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGitlabWebhook = exports.handleGithubWebhook = void 0;
const Task_1 = require("../models/Task");
const errorHandler_1 = require("../middleware/errorHandler");
// Parse task IDs from commit messages like "Fixes #123" or "Closes #456"
const extractTaskRefs = (message) => {
    const pattern = /(?:fixes|closes|resolves)\s+#(\w+)/gi;
    const refs = [];
    let match;
    while ((match = pattern.exec(message)) !== null) {
        refs.push(match[1]);
    }
    return refs;
};
const handleGithubWebhook = async (req, res, next) => {
    try {
        const secret = process.env.GITHUB_WEBHOOK_SECRET;
        if (secret) {
            const signature = req.headers['x-hub-signature-256'];
            if (!signature) {
                return next(new errorHandler_1.AppError('Missing webhook signature', 401));
            }
            // In production, verify HMAC signature here
        }
        const event = req.headers['x-github-event'];
        const payload = req.body;
        // Handle PR merge
        if (event === 'pull_request' && payload.action === 'closed' && payload.pull_request?.merged) {
            const prTitle = payload.pull_request.title;
            const taskRefs = extractTaskRefs(prTitle);
            for (const ref of taskRefs) {
                await Task_1.Task.findByIdAndUpdate(ref, {
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
                    await Task_1.Task.findByIdAndUpdate(ref, { status: 'In Progress' });
                }
            }
        }
        res.json({ success: true, message: 'Webhook processed' });
    }
    catch (err) {
        next(err);
    }
};
exports.handleGithubWebhook = handleGithubWebhook;
const handleGitlabWebhook = async (req, res, next) => {
    try {
        const secret = process.env.GITLAB_WEBHOOK_SECRET;
        if (secret && req.headers['x-gitlab-token'] !== secret) {
            return next(new errorHandler_1.AppError('Invalid webhook token', 401));
        }
        const payload = req.body;
        // Handle MR merge
        if (payload.object_kind === 'merge_request' &&
            payload.object_attributes?.state === 'merged') {
            const title = payload.object_attributes.title;
            const taskRefs = extractTaskRefs(title);
            for (const ref of taskRefs) {
                await Task_1.Task.findByIdAndUpdate(ref, {
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
                    await Task_1.Task.findByIdAndUpdate(ref, { status: 'In Progress' });
                }
            }
        }
        res.json({ success: true, message: 'Webhook processed' });
    }
    catch (err) {
        next(err);
    }
};
exports.handleGitlabWebhook = handleGitlabWebhook;
//# sourceMappingURL=webhook.controller.js.map