import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import type { UploadProgressPayload, UploadStatus, ValidationError } from '../types/domain.js';

interface PublishProgressArgs {
  batchId: string;
  status: UploadStatus;
  processedRows: number;
  totalRows: number;
  progress: number;
  message: string;
  errors?: ValidationError[];
}

export async function publishProgress(args: PublishProgressArgs) {
  await prisma.uploadBatch.update({
    where: { id: args.batchId },
    data: {
      status: args.status,
      processedRows: args.processedRows,
      totalRows: args.totalRows,
      message: args.message,
      errorReport: args.errors ? JSON.parse(JSON.stringify(args.errors)) : undefined,
    },
  });

  const payload: UploadProgressPayload = {
    batchId: args.batchId,
    status: args.status,
    processedRows: args.processedRows,
    totalRows: args.totalRows,
    progress: args.progress,
    message: args.message,
    errors: args.errors,
  };

  await redis.publish('upload:progress', JSON.stringify(payload));
}