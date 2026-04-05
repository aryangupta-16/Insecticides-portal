"use client";

import { useEffect, useState } from "react";
import { CalendarRange, FileSpreadsheet, LoaderCircle, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UploadProgressPayload } from "@/types";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, month: string, year: number) => Promise<void>;
  progress: UploadProgressPayload | null;
  isSubmitting: boolean;
}

const monthOptions = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function UploadModal({ open, onOpenChange, onUpload, progress, isSubmitting }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState("March");
  const [year, setYear] = useState<number | null>(null);
  const [yearOptions, setYearOptions] = useState<number[]>([]);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setYear(currentYear);
    setYearOptions(Array.from({ length: 8 }, (_, index) => currentYear - 3 + index));
  }, []);

  async function handleSubmit() {
    if (!file) {
      return;
    }

    if (year === null) {
      return;
    }

    await onUpload(file, month, year);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload monthly file</DialogTitle>
          <DialogDescription>Select the reporting month and year, then upload the latest file for that period.</DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Month</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Year</label>
              <Select value={year === null ? undefined : String(year)} onValueChange={(value) => setYear(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <div className="mb-3 flex items-center gap-3 text-slate-700">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">Excel file</span>
            </div>
            <Input type="file" accept=".xlsx,.xls" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <p className="mt-2 text-xs text-slate-500">Supported formats: `.xlsx`, `.xls`.</p>
          </div>

          {progress && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{progress.message}</p>
                  <p className="text-xs text-slate-500">{progress.processedRows} / {progress.totalRows || "?"} rows processed</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">{progress.progress}%</div>
              </div>
              <Progress value={progress.progress} />
              {progress.errors?.length ? (
                <div className="mt-4 max-h-32 overflow-auto rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {progress.errors.slice(0, 5).map((error) => (
                    <p key={`${error.row}-${error.field}`}>Row {error.row}: {error.field} — {error.message}</p>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CalendarRange className="h-5 w-5 text-blue-600" />
              <span>Selected period: {month} {year ?? "—"}</span>
            </div>
            <Button onClick={handleSubmit} disabled={!file || isSubmitting || year === null}>
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              <span className="ml-2">Upload file</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}