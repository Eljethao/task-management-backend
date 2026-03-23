"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)('Admin', 'Project Manager'), user_controller_1.getUsers);
router.post('/', (0, auth_1.authorize)('Admin', 'Project Manager'), user_controller_1.createUser);
router.get('/:id', user_controller_1.getUserById);
router.patch('/:id', user_controller_1.updateUser);
router.patch('/:id/reactivate', (0, auth_1.authorize)('Admin', 'Project Manager'), user_controller_1.reactivateUser);
router.delete('/:id', (0, auth_1.authorize)('Admin', 'Project Manager'), user_controller_1.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map