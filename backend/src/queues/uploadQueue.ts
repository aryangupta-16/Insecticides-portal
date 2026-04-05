import { Queue } from 'bullmq';

import { redis } from '../lib/redis.js';

export interface UploadJobData {
  batchId: string;
  month: string;
  year: number;
  filePath: string;
  originalName: string;
}

export const uploadQueueName = 'monthly-upload';

export const uploadQueue = new Queue<UploadJobData>(uploadQueueName, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});