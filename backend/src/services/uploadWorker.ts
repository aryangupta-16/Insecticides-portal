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

      console.info('[upload-worker] Starting job', {
        jobId: job.id,
        batchId,
        month,
        year,
        filePath,
      });

      await publishProgress({
        batchId,
        status: 'processing',
        processedRows: 0,
        totalRows: 0,
        progress: 0,
        message: `Started processing ${month} ${year}`,
      });

      const result = await processUploadJob(batchId, month, year, filePath);

      console.info('[upload-worker] Finished job', {
        jobId: job.id,
        batchId,
        totalRows: result.totalRows,
      });

      return result;
    },
    {
      connection: redis,
      concurrency: 1,
    },
  );

  uploadWorker.on('failed', async (job, error) => {
    if (!job) {
      return;
    }

    console.error('[upload-worker] Job failed', {
      jobId: job.id,
      batchId: job.data.batchId,
      error: error.message,
    });

    await publishProgress({
      batchId: job.data.batchId,
      status: 'failed',
      processedRows: 0,
      totalRows: 0,
      progress: 0,
      message: error.message || 'Upload failed unexpectedly',
    });
  });

  uploadWorker.on('completed', (job) => {
    console.info('[upload-worker] Job completed', {
      jobId: job.id,
      batchId: job.data.batchId,
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