"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandupComment = void 0;
const mongoose_1 = require("mongoose");
const standupCommentSchema = new mongoose_1.Schema({
    standupId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Standup', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
}, { timestamps: true });
exports.StandupComment = (0, mongoose_1.model)('StandupComment', standupCommentSchema);
//# sourceMappingURL=StandupComment.js.map