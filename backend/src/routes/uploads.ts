import path from 'node:path';
import fs from 'node:fs/promises';

import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { uploadQueue } from '../queues/uploadQueue.js';
import { cleanupLocalUpload, uploadWorkbookFromLocalFile } from '../services/fileStorageService.js';
import { ensureUploadDir } from '../utils/helpers.js';

const uploadRouter = Router();

const uploadSchema = z.object({
  month: z.string().min(3),
  year: z.coerce.number().int().min(2000).max(2100),
});

const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    await ensureUploadDir();
    callback(null, env.uploadDir);
  },
  filename: (_req, file, callback) => {
    const timestamp = Date.now();
    callback(null, `${timestamp}-${file.originalname.replace(/\s+/g, '-')}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, callback) => {
    const allowed = file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls');
    if (!allowed) {
      callback(new Error('Only Excel files are supported'));
      return;
    }

    callback(null, true);
  },
});

uploadRouter.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const parsed = uploadSchema.parse(req.body);

    if (!req.file) {
      return res.status(400).json({ message: 'Excel file is required' });
    }

    const localFilePath = path.resolve(req.file.path);
    let queuedFilePath = localFilePath;

    try {
      queuedFilePath = await uploadWorkbookFromLocalFile(localFilePath, req.file.originalname, parsed.month, parsed.year);
    } catch (storageError) {
      await fs.unlink(localFilePath).catch(() => undefined);
      throw storageError;
    }

    if (queuedFilePath !== localFilePath) {
      await cleanupLocalUpload(localFilePath);
    }

    const batch = await prisma.uploadBatch.create({
      data: {
        month: parsed.month,
        year: parsed.year,
        originalName: req.file.originalname,
        filePath: queuedFilePath,
        status: 'queued',
        message: 'Upload queued',
      },
    });

    await uploadQueue.add('process-monthly-upload', {
      batchId: batch.id,
      month: parsed.month,
      year: parsed.year,
      filePath: queuedFilePath,
      originalName: req.file.originalname,
    });

    return res.status(202).json({ batchId: batch.id, status: 'queued' });
  } catch (error) {
    return next(error);
  }
});

uploadRouter.get('/:batchId', async (req, res, next) => {
  try {
    const batch = await prisma.uploadBatch.findUnique({ where: { id: req.params.batchId } });

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    return res.json(batch);
  } catch (error) {
    return next(error);
  }
});

export { uploadRouter };