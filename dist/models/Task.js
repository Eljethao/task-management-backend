"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const mongoose_1 = require("mongoose");
const taskSchema = new mongoose_1.Schema({
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    epicId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Task', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
        type: String,
        enum: ['To Do', 'In Progress', 'Code Review', 'Testing', 'Done'],
        default: 'To Do',
        index: true,
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
    },
    assigneeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    reporterId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    storyPoints: { type: Number, min: 0, max: 100, default: null },
    tags: [{ type: String, trim: true }],
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    githubPrLink: { type: String, default: null },
    order: { type: Number, default: 0 },
}, { timestamps: true });
taskSchema.index({ projectId: 1, status: 1, order: 1 });
taskSchema.index({ assigneeId: 1, status: 1 });
exports.Task = (0, mongoose_1.model)('Task', taskSchema);
//# sourceMappingURL=Task.js.map