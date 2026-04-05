export type UploadStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface UploadProgressPayload {
  batchId: string;
  status: UploadStatus;
  processedRows: number;
  totalRows: number;
  progress: number;
  message: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParsedUploadRow {
  vp: string;
  state: string;
  staff: string;
  partyId: string;
  party: string;
  totalOutstanding: string;
  aging121To150: string;
  aging151To180: string;
  aging181To240: string;
  aging241To365: string;
  aging366To540: string;
  agingAbove540: string;
  zmComment: string;
  staffComment: string;
  rowSequence: number;
}

export interface QueryFilters {
  months: string[];
  years: number[];
  states: string[];
  staffs: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  bypassPageLimit?: boolean;
}