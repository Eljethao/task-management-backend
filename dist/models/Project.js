"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const mongoose_1 = require("mongoose");
const projectDocumentSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: false });
const projectSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    status: {
        type: String,
        enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'],
        default: 'Planning',
        index: true,
    },
    targetDate: { type: Date, required: true },
    internalTestDate: { type: Date, default: null },
    uatDate: { type: Date, default: null },
    productionDate: { type: Date, default: null },
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    memberIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    logoUrl: { type: String, default: null },
    documents: { type: [projectDocumentSchema], default: [] },
}, { timestamps: true });
exports.Project = (0, mongoose_1.model)('Project', projectSchema);
//# sourceMappingURL=Project.js.map