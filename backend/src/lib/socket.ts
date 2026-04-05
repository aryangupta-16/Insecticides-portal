import type { Server as HttpServer } from 'node:http';

import { Server } from 'socket.io';

import { env } from '../config/env.js';

let io: Server | null = null;

export function registerSocketServer(server: HttpServer) {
  const allowAnyOrigin = env.frontendOrigin === '*';

  io = new Server(server, {
    cors: {
      origin: allowAnyOrigin ? '*' : env.frontendOrigin,
      methods: ['GET', 'POST', 'PATCH'],
      credentials: !allowAnyOrigin,
    },
  });

  io.on('connection', (socket) => {
    socket.on('upload:join', (batchId: string) => {
      if (batchId) {
        socket.join(batchId);
      }
    });

    socket.on('upload:leave', (batchId: string) => {
      if (batchId) {
        socket.leave(batchId);
      }
    });
  });

  return io;
}

export function getIo() {
  if (!io) {
    throw new Error('Socket server not initialized');
  }

  return io;
}