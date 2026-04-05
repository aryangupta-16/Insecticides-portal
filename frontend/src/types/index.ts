export interface MonthlyDataRow {
  id: string;
  vp: string;
  state: string;
  staff: string;
  partyId: string;
  party: string;
  month: string;
  year: number;
  totalOutstanding: number;
  aging121To150: number;
  aging151To180: number;
  aging181To240: number;
  aging241To365: number;
  aging366To540: number;
  agingAbove540: number;
  rowSequence: number;
  zmComment: string;
  staffComment: string;
  updatedAt: string;
}

export interface FilterOptions {
  months: string[];
  years: number[];
  states: string[];
  staffs: string[];
}

export interface DashboardFilters {
  months: string[];
  years: number[];
  states: string[];
  staffs: string[];
  search: string;
}

export interface DashboardSummary {
  totalOutstanding: number;
  highAging: number;
  uniqueParties: number;
  totalRecords: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface RowsResponse {
  rows: MonthlyDataRow[];
  summary: DashboardSummary;
  pagination: PaginationState;
}

export interface UploadProgressPayload {
  batchId: string;
  status: "queued" | "processing" | "completed" | "failed";
  processedRows: number;
  totalRows: number;
  progress: number;
  message: string;
  errors?: Array<{ row: number; field: string; message: string }>;
}