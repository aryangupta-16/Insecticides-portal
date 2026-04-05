"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import { Download, Filter, LoaderCircle, RefreshCcw, Search, SlidersHorizontal, Upload, X } from "lucide-react";
import { io, type Socket } from "socket.io-client";

import { DataTable } from "@/components/dashboard/data-table";
import { UploadModal } from "@/components/dashboard/upload-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchFilterOptions, fetchRows, getApiBaseUrl, getExportUrl, updateComment, uploadWorkbook } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardFilters, DashboardSummary, FilterOptions, MonthlyDataRow, PaginationState, UploadProgressPayload } from "@/types";

const initialFilters: DashboardFilters = {
  months: [],
  years: [],
  states: [],
  staffs: [],
  search: "",
};

function FilterGroup({ label, options, selected, onToggle }: { label: string; options: Array<string | number>; selected: Array<string | number>; onToggle: (value: string) => void }) {
  const selectedSet = new Set(selected.map(String));

  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <Badge>{selected.length} selected</Badge>
      </div>
      <div className="max-h-40 space-y-2 overflow-auto pr-2">
        {options.length ? (
          options.map((option) => {
            const normalized = String(option);
            const checked = selectedSet.has(normalized);

            return (
              <div key={normalized} className="flex items-center gap-3 rounded-2xl px-2 py-1.5 text-sm text-slate-700 transition hover:bg-white">
                <Checkbox checked={checked} onCheckedChange={() => onToggle(normalized)} />
                <span>{normalized}</span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">No values yet</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "blue" | "violet" | "emerald" | "slate" }) {
  const toneClassMap = {
    blue: "from-blue-50 to-white border-blue-100",
    violet: "from-violet-50 to-white border-violet-100",
    emerald: "from-emerald-50 to-white border-emerald-100",
    slate: "from-slate-50 to-white border-slate-200",
  };

  return (
    <div className={cn("rounded-3xl border bg-gradient-to-br p-5", toneClassMap[tone ?? "slate"])}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export function DashboardShell() {
  const [rows, setRows] = useState<MonthlyDataRow[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState("");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ months: [], years: [], states: [], staffs: [] });
  const [summary, setSummary] = useState<DashboardSummary>({ totalOutstanding: 0, highAging: 0, uniqueParties: 0, totalRecords: 0 });
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 50, totalCount: 0, totalPages: 1 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressPayload | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const loadFilterOptions = useCallback(async () => {
    const fetchedOptions = await fetchFilterOptions();
    setFilterOptions(fetchedOptions);
  }, []);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFilters((current) => (current.search === searchInput ? current : { ...current, search: searchInput }));
      setPagination((current) => (current.page === 1 ? current : { ...current, page: 1 }));
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      setLoading(true);
      try {
        const result = await fetchRows(filters, {
          page: pagination.page,
          pageSize: pagination.pageSize,
          sortBy,
          sortOrder,
        });

        if (cancelled) {
          return;
        }

        setRows(result.rows);
        setSummary(result.summary);
        setPagination(result.pagination);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRows();

    return () => {
      cancelled = true;
    };
  }, [filters, pagination.page, pagination.pageSize, sortBy, sortOrder, refreshKey]);

  useEffect(() => {
    let socket: Socket | null = null;

    if (activeBatchId) {
      socket = io(getApiBaseUrl(), { transports: ["websocket"] });
      socket.emit("upload:join", activeBatchId);
      socket.on("upload:progress", (payload: UploadProgressPayload) => {
        setUploadProgress(payload);

        if (payload.status === "completed" || payload.status === "failed") {
          setUploading(false);
          void loadFilterOptions();
          setPagination((current) => ({ ...current, page: 1 }));
          setRefreshKey((current) => current + 1);
        }
      });
    }

    return () => {
      if (socket && activeBatchId) {
        socket.emit("upload:leave", activeBatchId);
        socket.disconnect();
      }
    };
  }, [activeBatchId, loadFilterOptions]);

  const activeFilters = useMemo(
    () => [
      ...filters.months.map((value) => ({ key: "months" as const, value: String(value), label: `Month: ${value}` })),
      ...filters.years.map((value) => ({ key: "years" as const, value: String(value), label: `Year: ${value}` })),
      ...filters.states.map((value) => ({ key: "states" as const, value: String(value), label: `State: ${value}` })),
      ...filters.staffs.map((value) => ({ key: "staffs" as const, value: String(value), label: `Staff: ${value}` })),
    ],
    [filters],
  );

  async function handleUpload(file: File, month: string, year: number) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("month", month);
    formData.append("year", String(year));

    setUploading(true);
    setUploadProgress({
      batchId: "pending",
      status: "queued",
      processedRows: 0,
      totalRows: 0,
      progress: 0,
      message: "Queueing upload...",
    });

    const payload = await uploadWorkbook(formData);
    setActiveBatchId(payload.batchId);
    setPagination((current) => ({ ...current, page: 1 }));
    setUploadProgress((previous) => (previous ? { ...previous, batchId: payload.batchId, message: "Upload queued" } : previous));
  }

  async function handleCommentSave(rowId: string, field: "zmComment" | "staffComment", value: string) {
    await updateComment(rowId, field, value);
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  }

  function toggleFilter(key: keyof Omit<DashboardFilters, "search">, value: string) {
    const parsedValue = key === "years" ? Number(value) : value;

    setFilters((current) => {
      const currentValues = current[key] as Array<string | number>;
      const nextValues = currentValues.includes(parsedValue) ? currentValues.filter((item) => item !== parsedValue) : [...currentValues, parsedValue];
      return { ...current, [key]: nextValues } as DashboardFilters;
    });
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
  }

  function clearAllFilters() {
    setFilters(initialFilters);
    setSearchInput("");
    setSorting([]);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function goToPreviousPage() {
    setPagination((current) => ({ ...current, page: Math.max(current.page - 1, 1) }));
  }

  function goToNextPage() {
    setPagination((current) => ({ ...current, page: Math.min(current.page + 1, current.totalPages) }));
  }

  function changePageSize(value: number) {
    setPagination((current) => ({ ...current, page: 1, pageSize: value }));
  }

  const filterPanel = (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
        <Input value={searchInput} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search VP, State, Staff, Party" className="pl-11" />
      </div>
      <FilterGroup label="Months" options={filterOptions.months} selected={filters.months} onToggle={(value) => toggleFilter("months", value)} />
      <FilterGroup label="Years" options={filterOptions.years} selected={filters.years} onToggle={(value) => toggleFilter("years", value)} />
      <FilterGroup label="States" options={filterOptions.states} selected={filters.states} onToggle={(value) => toggleFilter("states", value)} />
      <FilterGroup label="Staff" options={filterOptions.staffs} selected={filters.staffs} onToggle={(value) => toggleFilter("staffs", value)} />
      <Button variant="outline" className="w-full" onClick={clearAllFilters}>Clear all filters</Button>
    </div>
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-3xl sm:text-4xl">Receivables Dashboard</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7 text-slate-600">
              Review monthly outstanding balances, monitor aging exposure, and manage account-level follow-up comments in one place.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total outstanding" value={formatCurrency(summary.totalOutstanding)} tone="blue" />
            <StatCard label=">540 aging" value={formatCurrency(summary.highAging)} tone="violet" />
            <StatCard label="Unique parties" value={String(summary.uniqueParties)} tone="emerald" />
            <StatCard label="Total records" value={String(summary.totalRecords)} tone="slate" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Upload the latest workbook, refresh the view, or export the current results.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Button className="justify-start" onClick={() => setModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" /> Upload file
              </Button>
              <Button variant="secondary" className="justify-start" onClick={() => setRefreshKey((current) => current + 1)}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Refresh data
              </Button>
            </div>
            <Button asChild variant="outline" className="w-full justify-start">
              <a href={getExportUrl(filters)} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" /> Export results
              </a>
            </Button>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Upload status</p>
              <p className="mt-1 text-sm text-slate-500">{uploadProgress ? uploadProgress.message : "No active upload in progress"}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="hidden h-fit xl:block xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5 text-violet-600" /> Filters</CardTitle>
            <CardDescription>Search globally and combine month, year, state, and staff filters for focused review and export.</CardDescription>
          </CardHeader>
          <CardContent>{filterPanel}</CardContent>
        </Card>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Current dataset</h2>
                <p className="text-sm text-slate-500">Showing {rows.length} of {pagination.totalCount} records</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input value={searchInput} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search VP, State, Staff, Party" className="pl-11" />
                </div>
                <Button variant="outline" className="xl:hidden" onClick={() => setFiltersOpen(true)}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
                </Button>
              </div>
            </div>

            {activeFilters.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <button type="button" key={`${filter.key}-${filter.value}`} onClick={() => toggleFilter(filter.key, filter.value)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                    {filter.label}
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))}
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>Clear all</Button>
              </div>
            ) : null}

            {loading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading records</div>
            ) : null}
          </div>

          <DataTable
            rows={rows}
            sorting={sorting}
            onSortingChange={(updater) => {
              setSorting((current) => {
                const next = typeof updater === "function" ? updater(current) : updater;
                setPagination((previous) => ({ ...previous, page: 1 }));
                return next;
              });
            }}
            onCommentSave={handleCommentSave}
          />

          <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-500">
                Rows
                <select
                  value={pagination.pageSize}
                  onChange={(event) => changePageSize(Number(event.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                >
                  {[25, 50, 100, 200].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
              <Button variant="outline" onClick={goToPreviousPage} disabled={pagination.page <= 1 || loading}>Previous</Button>
              <Button variant="outline" onClick={goToNextPage} disabled={pagination.page >= pagination.totalPages || loading}>Next</Button>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="xl:hidden">
          <DialogHeader>
            <DialogTitle>Filter records</DialogTitle>
            <DialogDescription>Select one or more filters to narrow the current view.</DialogDescription>
          </DialogHeader>
          <div className="mt-5">{filterPanel}</div>
        </DialogContent>
      </Dialog>

      <UploadModal open={modalOpen} onOpenChange={setModalOpen} onUpload={handleUpload} progress={uploadProgress} isSubmitting={uploading} />
    </main>
  );
}
