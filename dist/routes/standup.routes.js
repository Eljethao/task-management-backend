"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const standup_controller_1 = require("../controllers/standup.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', standup_controller_1.getStandups);
router.get('/today', standup_controller_1.getTodayStandup);
router.post('/', standup_controller_1.createStandup);
router.patch('/:id', standup_controller_1.updateStandup);
router.get('/:id/comments', standup_controller_1.getStandupComments);
router.post('/:id/comments', (0, auth_1.authorize)('Admin', 'Project Manager'), standup_controller_1.addStandupComment);
exports.default = router;
//# sourceMappingURL=standup.routes.js.map