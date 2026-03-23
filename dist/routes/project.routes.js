"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_controller_1 = require("../controllers/project.controller");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', project_controller_1.getProjects);
router.get('/:id', project_controller_1.getProjectById);
router.post('/', (0, auth_1.authorize)('Admin', 'Project Manager'), upload_1.uploadProjectFiles, project_controller_1.createProject);
router.patch('/:id', (0, auth_1.authorize)('Admin', 'Project Manager'), upload_1.uploadProjectFiles, project_controller_1.updateProject);
router.delete('/:id/documents/:docUrl', (0, auth_1.authorize)('Admin', 'Project Manager'), project_controller_1.deleteProjectDocument);
router.delete('/:id', (0, auth_1.authorize)('Admin', 'Project Manager'), project_controller_1.deleteProject);
exports.default = router;
//# sourceMappingURL=project.routes.js.map