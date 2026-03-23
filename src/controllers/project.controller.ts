import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Project } from '../models/Project';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { S3File } from '../middleware/upload';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['Planning', 'Active', 'On Hold', 'Completed', 'Archived']).optional(),
  targetDate: z.string().datetime(),
  memberIds: z.array(z.string()).optional(),
  internalTestDate: z.string().datetime().optional().nullable(),
  uatDate: z.string().datetime().optional().nullable(),
  productionDate: z.string().datetime().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['Planning', 'Active', 'On Hold', 'Completed', 'Archived']).optional(),
  targetDate: z.string().datetime().optional(),
  memberIds: z.array(z.string()).optional(),
  internalTestDate: z.string().datetime().optional().nullable(),
  uatDate: z.string().datetime().optional().nullable(),
  productionDate: z.string().datetime().optional().nullable(),
});

/** Extract S3 file metadata from multer-s3 file objects */
function extractFiles(req: Request) {
  const files = req.files as Record<string, S3File[]> | undefined;

  const logoUrl: string | undefined = files?.logo?.[0]?.location;

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

export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isPrivileged = PRIVILEGED_ROLES.includes(req.user?.role ?? '');

    // Admin & Project Manager see every project; others see only projects they belong to
    const query = isPrivileged
      ? {}
      : { $or: [{ ownerId: req.user?.userId }, { memberIds: req.user?.userId }] };

    const projects = await Project.find(query)
      .populate('ownerId', 'name email')
      .populate('memberIds', 'name email')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: { projects } });
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('ownerId', 'name email')
      .populate('memberIds', 'name email');

    if (!project) return next(new AppError('Project not found', 404));

    // Non-privileged users can only view projects they belong to
    const isPrivileged = PRIVILEGED_ROLES.includes(req.user?.role ?? '');
    if (!isPrivileged) {
      const userId = req.user?.userId ?? '';
      const isMember =
        project.ownerId?.toString() === userId ||
        (project.memberIds as unknown[]).some((m) =>
          typeof m === 'object' && m !== null
            ? (m as { _id: { toString(): string } })._id.toString() === userId
            : m?.toString() === userId
        );
      if (!isMember) return next(new AppError('Access denied', 403));
    }

    res.json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = createSchema.parse(
      typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body
    );
    const { logoUrl, documents } = extractFiles(req as Request);

    const project = await Project.create({
      ...body,
      ownerId: req.user?.userId,
      ...(logoUrl && { logoUrl }),
      ...(documents.length > 0 && { documents }),
    });

    res.status(201).json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = updateSchema.parse(
      typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body
    );
    const { logoUrl, documents } = extractFiles(req as Request);

    const update: Record<string, unknown> = { ...body };
    if (logoUrl) update.logoUrl = logoUrl;
    if (documents.length > 0) {
      // Append new documents; to replace all, swap $push for $set
      update['$push'] = { documents: { $each: documents } };
      delete update.documents;
    }

    const project = await Project.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!project) return next(new AppError('Project not found', 404));
    res.json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return next(new AppError('Project not found', 404));
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/** DELETE a single document from a project */
export const deleteProjectDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, docUrl } = req.params;
    const project = await Project.findByIdAndUpdate(
      id,
      { $pull: { documents: { url: decodeURIComponent(docUrl) } } },
      { new: true }
    );
    if (!project) return next(new AppError('Project not found', 404));
    res.json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
};
