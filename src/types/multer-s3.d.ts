// Ambient declarations for multer-s3 v3 (no official @types package)
declare module 'multer-s3' {
  import { StorageEngine } from 'multer';
  import { S3Client } from '@aws-sdk/client-s3';

  interface Options {
    s3: S3Client;
    bucket: string;
    contentType?: unknown;
    key?: (req: unknown, file: Express.Multer.File, cb: (err: Error | null, key: string) => void) => void;
    metadata?: (req: unknown, file: Express.Multer.File, cb: (err: Error | null, meta: Record<string, string>) => void) => void;
    acl?: string;
  }

  function multerS3(options: Options): StorageEngine;
  namespace multerS3 {
    const AUTO_CONTENT_TYPE: unknown;
  }

  export = multerS3;
}
