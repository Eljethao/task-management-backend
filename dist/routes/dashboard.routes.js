"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('Admin', 'Project Manager'));
router.get('/metrics', dashboard_controller_1.getDashboardMetrics);
router.get('/projects', dashboard_controller_1.getProjectOverview);
router.get('/workload', dashboard_controller_1.getTeamWorkload);
router.get('/blockers', dashboard_controller_1.getBlockers);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map