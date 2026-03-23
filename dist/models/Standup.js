"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Standup = void 0;
const mongoose_1 = require("mongoose");
const standupSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    date: { type: Date, required: true, index: true },
    yesterday: { type: String, required: true },
    today: { type: String, required: true },
    blockers: { type: String, default: '' },
}, { timestamps: true });
// One standup per user per project per day
standupSchema.index({ userId: 1, projectId: 1, date: 1 }, { unique: true });
exports.Standup = (0, mongoose_1.model)('Standup', standupSchema);
//# sourceMappingURL=Standup.js.map