"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProjectDocument = exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjectById = exports.getProjects = void 0;
const zod_1 = require("zod");
const Project_1 = require("../models/Project");
const errorHandler_1 = require("../middleware/errorHandler");
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['Planning', 'Active', 'On Hold', 'Completed', 'Archived']).optional(),
    targetDate: zod_1.z.string().datetime(),
    memberIds: zod_1.z.array(zod_1.z.string()).optional(),
    internalTestDate: zod_1.z.string().datetime().optional().nullable(),
    uatDate: zod_1.z.string().datetime().optional().nullable(),
    productionDate: zod_1.z.string().datetime().optional().nullable(),
});
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['Planning', 'Active', 'On Hold', 'Completed', 'Archived']).optional(),
    targetDate: zod_1.z.string().datetime().optional(),
    memberIds: zod_1.z.array(zod_1.z.string()).optional(),
    internalTestDate: zod_1.z.string().datetime().optional().nullable(),
    uatDate: zod_1.z.string().datetime().optional().nullable(),
    productionDate: zod_1.z.string().datetime().optional().nullable(),
});
/** Extract S3 file metadata from multer-s3 file objects */
function extractFiles(req) {
    const files = req.files;
    const logoUrl = files?.logo?.[0]?.location;
    const documents = (files?.documents ?? []).map((f) => ({
        name: f.originalname,
        url: f.location,
        mimetype: f.mimetype,
        size: f.size,
        uploadedAt: new Date(),
    }));
    return { logoUrl, documents };
}
const PRIVILEGED_ROLES = ['Admin', 'Project Manager'];
const getProjects = async (req, res, next) => {
    try {
        const isPrivileged = PRIVILEGED_ROLES.includes(req.user?.role ?? '');
        // Admin & Project Manager see every project; others see only projects they belong to
        const query = isPrivileged
            ? {}
            : { $or: [{ ownerId: req.user?.userId }, { memberIds: req.user?.userId }] };
        const projects = await Project_1.Project.find(query)
            .populate('ownerId', 'name email')
            .populate('memberIds', 'name email')
            .sort({ updatedAt: -1 });
        res.json({ success: true, data: { projects } });
    }
    catch (err) {
        next(err);
    }
};
exports.getProjects = getProjects;
const getProjectById = async (req, res, next) => {
    try {
        const project = await Project_1.Project.findById(req.params.id)
            .populate('ownerId', 'name email')
            .populate('memberIds', 'name email');
        if (!project)
            return next(new errorHandler_1.AppError('Project not found', 404));
        // Non-privileged users can only view projects they belong to
        const isPrivileged = PRIVILEGED_ROLES.includes(req.user?.role ?? '');
        if (!isPrivileged) {
            const userId = req.user?.userId ?? '';
            const isMember = project.ownerId?.toString() === userId ||
                project.memberIds.some((m) => typeof m === 'object' && m !== null
                    ? m._id.toString() === userId
                    : m?.toString() === userId);
            if (!isMember)
                return next(new errorHandler_1.AppError('Access denied', 403));
        }
        res.json({ success: true, data: { project } });
    }
    catch (err) {
        next(err);
    }
};
exports.getProjectById = getProjectById;
const createProject = async (req, res, next) => {
    try {
        const body = createSchema.parse(typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body);
        const { logoUrl, documents } = extractFiles(req);
        const project = await Project_1.Project.create({
            ...body,
            ownerId: req.user?.userId,
            ...(logoUrl && { logoUrl }),
            ...(documents.length > 0 && { documents }),
        });
        res.status(201).json({ success: true, data: { project } });
    }
    catch (err) {
        next(err);
    }
};
exports.createProject = createProject;
const updateProject = async (req, res, next) => {
    try {
        const body = updateSchema.parse(typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body);
        const { logoUrl, documents } = extractFiles(req);
        const update = { ...body };
        if (logoUrl)
            update.logoUrl = logoUrl;
        if (documents.length > 0) {
            // Append new documents; to replace all, swap $push for $set
            update['$push'] = { documents: { $each: documents } };
            delete update.documents;
        }
        const project = await Project_1.Project.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true,
        });
        if (!project)
            return next(new errorHandler_1.AppError('Project not found', 404));
        res.json({ success: true, data: { project } });
    }
    catch (err) {
        next(err);
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res, next) => {
    try {
        const project = await Project_1.Project.findByIdAndDelete(req.params.id);
        if (!project)
            return next(new errorHandler_1.AppError('Project not found', 404));
        res.json({ success: true, message: 'Project deleted successfully' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteProject = deleteProject;
/** DELETE a single document from a project */
const deleteProjectDocument = async (req, res, next) => {
    try {
        const { id, docUrl } = req.params;
        const project = await Project_1.Project.findByIdAndUpdate(id, { $pull: { documents: { url: decodeURIComponent(docUrl) } } }, { new: true });
        if (!project)
            return next(new errorHandler_1.AppError('Project not found', 404));
        res.json({ success: true, data: { project } });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteProjectDocument = deleteProjectDocument;
//# sourceMappingURL=project.controller.js.map