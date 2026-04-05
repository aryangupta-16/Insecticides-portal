import { Worker } from 'bullmq';

import { redis } from '../lib/redis.js';
import { uploadQueueName } from '../queues/uploadQueue.js';
import { publishProgress } from './progressPublisher.js';
import { processUploadJob } from './uploadService.js';

let uploadWorker: Worker | null = null;

export function startUploadWorker() {
  if (uploadWorker) {
    return uploadWorker;
  }

  uploadWorker = new Worker(
    uploadQueueName,
    async (job) => {
      const { batchId, month, year, filePath } = job.data;

      await publishProgress({
        batchId,
        status: 'processing',
        processedRows: 0,
        totalRows: 0,
        progress: 0,
        message: `Started processing ${month} ${year}`,
      });

      return processUploadJob(batchId, month, year, filePath);
    },
    {
      connection: redis,
      concurrency: 2,
    },
  );

  uploadWorker.on('failed', async (job, error) => {
    if (!job) {
      return;
    }

    await publishProgress({
      batchId: job.data.batchId,
      status: 'failed',
      processedRows: 0,
      totalRows: 0,
      progress: 0,
      message: error.message || 'Upload failed unexpectedly',
    });
  });

  console.log('Upload worker started');

  return uploadWorker;
}

export async function stopUploadWorker() {
  if (!uploadWorker) {
    return;
  }

  await uploadWorker.close();
  uploadWorker = null;
}