"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProjectFiles = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const path_1 = __importDefault(require("path"));
const s3_1 = require("../lib/s3");
const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
exports.uploadProjectFiles = (0, multer_1.default)({
    storage: (0, multer_s3_1.default)({
        s3: s3_1.s3,
        bucket: s3_1.S3_BUCKET,
        contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
        key(_req, file, cb) {
            const folder = file.fieldname === 'logo' ? 'logos' : 'documents';
            const ext = path_1.default.extname(file.originalname);
            const name = `projects/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
            cb(null, name);
        },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter(_req, file, cb) {
        const allowed = file.fieldname === 'logo' ? ALLOWED_LOGO_TYPES : ALLOWED_DOC_TYPES;
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type not allowed: ${file.mimetype}`));
        }
    },
}).fields([
    { name: 'logo', maxCount: 1 },
    { name: 'documents', maxCount: 10 },
]);
//# sourceMappingURL=upload.js.map