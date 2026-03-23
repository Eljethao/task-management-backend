import { RequestHandler } from 'express';
/** multer-s3 enriches the standard File with an S3 location URL */
export interface S3File extends Express.Multer.File {
    location: string;
}
export declare const uploadProjectFiles: RequestHandler;
//# sourceMappingURL=upload.d.ts.map