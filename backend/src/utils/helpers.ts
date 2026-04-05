import fs from 'node:fs/promises';

import { env } from '../config/env.js';

export function normalizeHeader(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function toDecimalString(value: unknown) {
  const normalized = String(value ?? '').replace(/,/g, '').trim();
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed.toFixed(2) : null;
}

export function clampProgress(processedRows: number, totalRows: number) {
  if (totalRows <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((processedRows / totalRows) * 100));
}

export async function ensureUploadDir() {
  await fs.mkdir(env.uploadDir, { recursive: true });
}

export function toArrayParam(value: unknown) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean);
  }

  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}