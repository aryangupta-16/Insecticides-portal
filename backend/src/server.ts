import 'dotenv/config';
import http from 'node:http';

import cors from 'cors';
import express from 'express';

import './lib/network.js';

import { env } from './config/env.js';
import { redisSubscriber } from './lib/redis.js';
import { registerSocketServer } from './lib/socket.js';
import { dataRouter } from './routes/data.js';
import { healthRouter } from './routes/health.js';
import { uploadRouter } from './routes/uploads.js';
import { stopUploadWorker, startUploadWorker } from './services/uploadWorker.js';
import { ensureUploadDir } from './utils/helpers.js';

const app = express();
const allowAnyOrigin = env.frontendOrigin === '*';

app.use(
  cors({
    origin: allowAnyOrigin ? '*' : env.frontendOrigin,
    credentials: !allowAnyOrigin,
  }),
);
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/health', healthRouter);
app.use('/api/v1/uploads', uploadRouter);
app.use('/api/v1/data', dataRouter);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: error.message || 'Internal server error' });
});

const server = http.createServer(app);
const io = registerSocketServer(server);

await ensureUploadDir();

if (env.runWorkerInProcess) {
  startUploadWorker();
  console.log('Embedded upload worker enabled in API process');
}

await redisSubscriber.subscribe('upload:progress');
redisSubscriber.on('message', (_channel: string, message: string) => {
  try {
    const payload = JSON.parse(message);
    if (payload?.batchId) {
      io.to(payload.batchId).emit('upload:progress', payload);
    }
  } catch (error) {
    console.error('Invalid upload progress payload', error);
  }
});

server.listen(env.port, () => {
  console.log(`Backend API listening on http://localhost:${env.port}`);
});

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received, shutting down backend services...`);

  await stopUploadWorker();
  await redisSubscriber.unsubscribe('upload:progress');
  redisSubscriber.removeAllListeners('message');
  redisSubscriber.disconnect();

  server.close((error) => {
    if (error) {
      console.error('Failed to close HTTP server cleanly', error);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});