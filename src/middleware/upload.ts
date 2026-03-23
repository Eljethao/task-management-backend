import { RequestHandler } from 'express';
import multer, { FileFilterCallback } from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { s3, S3_BUCKET } from '../lib/s3';

/** multer-s3 enriches the standard File with an S3 location URL */
export interface S3File extends Express.Multer.File {
  location: string;
}

const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const uploadProjectFiles: RequestHandler = multer({
  storage: multerS3({
    s3,
    bucket: S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key(_req: unknown, file: Express.Multer.File, cb: (err: Error | null, key: string) => void) {
      const folder = file.fieldname === 'logo' ? 'logos' : 'documents';
      const ext = path.extname(file.originalname);
      const name = `projects/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(_req: unknown, file: Express.Multer.File, cb: FileFilterCallback) {
    const allowed = file.fieldname === 'logo' ? ALLOWED_LOGO_TYPES : ALLOWED_DOC_TYPES;
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'documents', maxCount: 10 },
]);
