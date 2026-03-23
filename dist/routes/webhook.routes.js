"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const router = (0, express_1.Router)();
// Webhooks are authenticated via secret token in headers, not JWT
router.post('/github', webhook_controller_1.handleGithubWebhook);
router.post('/gitlab', webhook_controller_1.handleGitlabWebhook);
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map