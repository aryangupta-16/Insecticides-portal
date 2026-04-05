import fs from 'node:fs/promises';

import { env } from '../config/env.js';
import { getSupabaseClient, isSupabaseStorageConfigured } from '../lib/supabase.js';

const STORAGE_PREFIX = 'supabase://';

function sanitizeSegment(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function buildObjectPath(month: string, year: number, originalName: string) {
  const timestamp = Date.now();
  return `uploads/${year}/${sanitizeSegment(month)}/${timestamp}-${sanitizeSegment(originalName)}`;
}

export function isSupabaseStoragePath(filePath: string) {
  return filePath.startsWith(STORAGE_PREFIX);
}

function parseSupabaseStoragePath(filePath: string) {
  if (!isSupabaseStoragePath(filePath)) {
    throw new Error('Invalid Supabase storage path');
  }

  const withoutPrefix = filePath.slice(STORAGE_PREFIX.length);
  const [bucket, ...pathParts] = withoutPrefix.split('/');
  return {
    bucket,
    objectPath: pathParts.join('/'),
  };
}

export async function uploadWorkbookFromLocalFile(localFilePath: string, originalName: string, month: string, year: number) {
  if (!isSupabaseStorageConfigured()) {
    return localFilePath;
  }

  const objectPath = buildObjectPath(month, year, originalName);
  const fileBuffer = await fs.readFile(localFilePath);
  const supabase = getSupabaseClient();
  const contentType = originalName.endsWith('.xls')
    ? 'application/vnd.ms-excel'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const { error } = await supabase.storage.from(env.supabaseStorageBucket).upload(objectPath, fileBuffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`);
  }

  return `${STORAGE_PREFIX}${env.supabaseStorageBucket}/${objectPath}`;
}

export async function readWorkbookBuffer(filePath: string) {
  if (!isSupabaseStoragePath(filePath)) {
    return fs.readFile(filePath);
  }

  const { bucket, objectPath } = parseSupabaseStoragePath(filePath);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.from(bucket).download(objectPath);

  if (error || !data) {
    throw new Error(`Failed to download workbook from Supabase Storage: ${error?.message || 'Missing file data'}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function cleanupLocalUpload(localFilePath: string) {
  try {
    await fs.unlink(localFilePath);
  } catch {
    // best-effort cleanup
  }
}