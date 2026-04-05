import { serializeFilters } from "@/lib/utils";
import type { DashboardFilters, FilterOptions, RowsResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const response = await fetch(`${API_BASE_URL}/api/v1/data/filters`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch filters");
  }

  return response.json();
}

export async function fetchRows(filters: DashboardFilters, options?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: "asc" | "desc" }): Promise<RowsResponse> {
  const query = serializeFilters({
    months: filters.months,
    years: filters.years,
    states: filters.states,
    staffs: filters.staffs,
    search: filters.search,
    page: options?.page,
    pageSize: options?.pageSize,
    sortBy: options?.sortBy,
    sortOrder: options?.sortOrder,
  });
  const response = await fetch(`${API_BASE_URL}/api/v1/data?${query}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch rows");
  }

  return response.json() as Promise<RowsResponse>;
}

export async function uploadWorkbook(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/uploads`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(payload.message || "Upload failed");
  }

  return response.json() as Promise<{ batchId: string; status: string }>;
}

export async function updateComment(rowId: string, field: "zmComment" | "staffComment", value: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/data/comments/${rowId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ field, value }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(payload.message || "Failed to update comment");
  }

  return response.json();
}

export function getExportUrl(filters: DashboardFilters) {
  const query = serializeFilters({
    months: filters.months,
    years: filters.years,
    states: filters.states,
    staffs: filters.staffs,
    search: filters.search,
  });

  return `${API_BASE_URL}/api/v1/data/export?${query}`;
}