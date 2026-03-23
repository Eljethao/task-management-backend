"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', task_controller_1.getTasks);
router.get('/:id', task_controller_1.getTaskById);
router.post('/', (0, auth_1.authorize)('Admin', 'Project Manager', 'Developer', 'Lead Developer', 'Tester', 'UXUI'), task_controller_1.createTask);
router.patch('/:id', task_controller_1.updateTask);
router.patch('/:id/status', task_controller_1.updateTaskStatus);
router.patch('/reorder', (0, auth_1.authorize)('Admin', 'Project Manager', 'Developer', 'Lead Developer', 'Tester', 'UXUI'), task_controller_1.reorderTasks);
router.delete('/:id', (0, auth_1.authorize)('Admin', 'Project Manager'), task_controller_1.deleteTask);
exports.default = router;
//# sourceMappingURL=task.routes.js.map