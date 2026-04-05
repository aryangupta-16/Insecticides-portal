import { Readable } from 'node:stream';

import ExcelJS from 'exceljs';

import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { expectedHeaders } from '../utils/constants.js';
import { clampProgress, normalizeHeader, toDecimalString } from '../utils/helpers.js';
import type { ParsedUploadRow, ValidationError } from '../types/domain.js';
import { readWorkbookBuffer } from './fileStorageService.js';
import { publishProgress } from './progressPublisher.js';

const INSERT_BATCH_SIZE = 500;

function chunkRows<T>(rows: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
}

function resolveHeaderMap(rowValues: unknown[]) {
  const headerMap = new Map<string, number>();

  rowValues.forEach((value, index) => {
    const normalized = normalizeHeader(value);
    if (normalized) {
      headerMap.set(normalized, index);
    }
  });

  return headerMap;
}

function getColumnIndex(headerMap: Map<string, number>, aliases: readonly string[]) {
  for (const alias of aliases) {
    const index = headerMap.get(alias);
    if (index !== undefined) {
      return index;
    }
  }

  return null;
}

function getCellValue(values: unknown[], columnIndex: number | null) {
  if (columnIndex === null) {
    return '';
  }

  const raw = values[columnIndex];

  if (raw && typeof raw === 'object' && 'result' in raw) {
    return String((raw as { result: unknown }).result ?? '').trim();
  }

  return String(raw ?? '').trim();
}

function parseWorkbookRow(values: unknown[], headerMap: Map<string, number>, rowNumber: number) {
  const validationErrors: ValidationError[] = [];

  const row: ParsedUploadRow = {
    vp: getCellValue(values, getColumnIndex(headerMap, expectedHeaders.vp)),
    state: getCellValue(values, getColumnIndex(headerMap, expectedHeaders.state)),
    staff: getCellValue(values, getColumnIndex(headerMap, expectedHeaders.staff)),
    partyId: getCellValue(values, getColumnIndex(headerMap, expectedHeaders.partyId)),
    party: getCellValue(values, getColumnIndex(headerMap, expectedHeaders.party)),
    totalOutstanding: '',
    aging121To150: '',
    aging151To180: '',
    aging181To240: '',
    aging241To365: '',
    aging366To540: '',
    agingAbove540: '',
    zmComment: getCellValue(values, getColumnIndex(headerMap, expectedHeaders.zmComment)),
    staffComment: getCellValue(values, getColumnIndex(headerMap, expectedHeaders.staffComment)),
    rowSequence: rowNumber - 1,
  };

  const numericFields = [
    ['totalOutstanding', expectedHeaders.totalOutstanding],
    ['aging121To150', expectedHeaders.aging121To150],
    ['aging151To180', expectedHeaders.aging151To180],
    ['aging181To240', expectedHeaders.aging181To240],
    ['aging241To365', expectedHeaders.aging241To365],
    ['aging366To540', expectedHeaders.aging366To540],
    ['agingAbove540', expectedHeaders.agingAbove540],
  ] as const;

  for (const [field, aliases] of numericFields) {
    const rawValue = getCellValue(values, getColumnIndex(headerMap, aliases));
    const parsed = toDecimalString(rawValue);

    if (parsed === null) {
      validationErrors.push({
        row: rowNumber,
        field,
        message: `Expected a numeric value for ${field}`,
      });
      continue;
    }

    row[field] = parsed;
  }

  const requiredTextFields = ['vp', 'state', 'staff', 'partyId', 'party'] as const;
  requiredTextFields.forEach((field) => {
    if (!row[field]) {
      validationErrors.push({
        row: rowNumber,
        field,
        message: `${field} is required`,
      });
    }
  });

  return { row, validationErrors };
}

export async function processUploadJob(batchId: string, month: string, year: number, filePath: string) {
  console.info('[upload-service] Loading workbook', { batchId, month, year, filePath });

  const workbook = new ExcelJS.Workbook();
  const workbookBuffer = await readWorkbookBuffer(filePath);
  await workbook.xlsx.read(Readable.from(workbookBuffer));

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    const errors = [{ row: 0, field: 'file', message: 'No worksheet found in uploaded file' }];
    await publishProgress({
      batchId,
      status: 'failed',
      processedRows: 0,
      totalRows: 0,
      progress: 0,
      message: 'Upload failed: missing worksheet',
      errors,
    });
    throw new Error(errors[0].message);
  }

  const totalRows = Math.max(worksheet.rowCount - 1, 0);
  const headerValues = Array.isArray(worksheet.getRow(1).values) ? worksheet.getRow(1).values : [];
  const headerMap = resolveHeaderMap(headerValues as unknown[]);
  const parsedRows: ParsedUploadRow[] = [];
  const validationErrors: ValidationError[] = [];

  console.info('[upload-service] Workbook loaded', { batchId, totalRows, sheetName: worksheet.name });

  await publishProgress({
    batchId,
    status: 'processing',
    processedRows: 0,
    totalRows,
    progress: 0,
    message: 'Validating worksheet headers and rows',
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const values = Array.isArray(row.values) ? row.values : [];
    const { row: parsedRow, validationErrors: rowErrors } = parseWorkbookRow(values as unknown[], headerMap, rowNumber);
    parsedRows.push(parsedRow);
    validationErrors.push(...rowErrors);
  });

  console.info('[upload-service] Parsing finished', {
    batchId,
    parsedRows: parsedRows.length,
    validationErrors: validationErrors.length,
  });

  if (validationErrors.length > 0) {
    await publishProgress({
      batchId,
      status: 'failed',
      processedRows: parsedRows.length,
      totalRows,
      progress: clampProgress(parsedRows.length, totalRows),
      message: 'Validation failed. No rows were imported.',
      errors: validationErrors.slice(0, 100),
    });
    throw new Error('Validation failed');
  }

  await publishProgress({
    batchId,
    status: 'processing',
    processedRows: parsedRows.length,
    totalRows,
    progress: 70,
    message: 'Writing validated rows to the database',
  });

  const monthlyDataChunks = chunkRows(parsedRows, INSERT_BATCH_SIZE);
  const commentChunks = chunkRows(parsedRows, INSERT_BATCH_SIZE);

  console.info('[upload-service] Starting database transaction', {
    batchId,
    totalRows: parsedRows.length,
    monthlyDataChunks: monthlyDataChunks.length,
    commentChunks: commentChunks.length,
    timeoutMs: env.uploadTransactionTimeoutMs,
  });

  await prisma.$transaction(async (tx) => {
    await tx.monthlyData.deleteMany({ where: { month, year } });
    await tx.comment.deleteMany({ where: { month, year } });

    for (const [index, rowsChunk] of monthlyDataChunks.entries()) {
      await tx.monthlyData.createMany({
        data: rowsChunk.map((row) => ({
          vp: row.vp,
          state: row.state,
          staff: row.staff,
          partyId: row.partyId,
          party: row.party,
          month,
          year,
          totalOutstanding: row.totalOutstanding,
          aging121To150: row.aging121To150,
          aging151To180: row.aging151To180,
          aging181To240: row.aging181To240,
          aging241To365: row.aging241To365,
          aging366To540: row.aging366To540,
          agingAbove540: row.agingAbove540,
          rowSequence: row.rowSequence,
          uploadBatchId: batchId,
        })),
      });

      console.info('[upload-service] Inserted monthly data chunk', {
        batchId,
        chunk: index + 1,
        totalChunks: monthlyDataChunks.length,
        rows: rowsChunk.length,
      });
    }

    for (const [index, rowsChunk] of commentChunks.entries()) {
      await tx.comment.createMany({
        data: rowsChunk.map((row) => ({
          month,
          year,
          rowSequence: row.rowSequence,
          zmComment: row.zmComment,
          staffComment: row.staffComment,
        })),
      });

      console.info('[upload-service] Inserted comment chunk', {
        batchId,
        chunk: index + 1,
        totalChunks: commentChunks.length,
        rows: rowsChunk.length,
      });
    }
  }, {
    maxWait: 10000,
    timeout: env.uploadTransactionTimeoutMs,
  });

  console.info('[upload-service] Database transaction committed', {
    batchId,
    totalRows: parsedRows.length,
  });

  await publishProgress({
    batchId,
    status: 'completed',
    processedRows: parsedRows.length,
    totalRows,
    progress: 100,
    message: `Imported ${parsedRows.length} rows successfully`,
  });

  return { totalRows: parsedRows.length };
}