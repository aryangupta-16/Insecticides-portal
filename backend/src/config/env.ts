import path from 'node:path';

const uploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');

export const env = {
  port: Number(process.env.PORT || 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  uploadDir,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || '',
  runWorkerInProcess: process.env.RUN_WORKER_IN_PROCESS
    ? process.env.RUN_WORKER_IN_PROCESS === 'true'
    : process.env.NODE_ENV === 'production',
};