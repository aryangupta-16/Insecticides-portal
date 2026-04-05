"use client";

import { useMemo } from "react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type OnChangeFn, type SortingState } from "@tanstack/react-table";
import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommentCell } from "@/components/dashboard/comment-cell";
import { cn, formatCurrency } from "@/lib/utils";
import type { MonthlyDataRow } from "@/types";

interface DataTableProps {
  rows: MonthlyDataRow[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onCommentSave: (rowId: string, field: "zmComment" | "staffComment", value: string) => Promise<void>;
}

export function DataTable({ rows, sorting, onSortingChange, onCommentSave }: DataTableProps) {
  const columns = useMemo<ColumnDef<MonthlyDataRow>[]>(
    () => [
      { accessorKey: "vp", header: "VP" },
      { accessorKey: "state", header: "State" },
      { accessorKey: "staff", header: "Staff" },
      { accessorKey: "partyId", header: "Party Id" },
      { accessorKey: "party", header: "Party" },
      {
        accessorKey: "month",
        header: "Period",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p>{row.original.month}</p>
            <p className="text-xs text-slate-400">{row.original.year}</p>
          </div>
        ),
      },
      {
        accessorKey: "totalOutstanding",
        header: "Total O/S",
        cell: ({ row }) => <Badge>{formatCurrency(row.original.totalOutstanding)}</Badge>,
      },
      {
        accessorKey: "aging121To150",
        header: "121-150",
        cell: ({ row }) => formatCurrency(row.original.aging121To150),
      },
      {
        accessorKey: "aging151To180",
        header: "151-180",
        cell: ({ row }) => formatCurrency(row.original.aging151To180),
      },
      {
        accessorKey: "aging181To240",
        header: "181-240",
        cell: ({ row }) => formatCurrency(row.original.aging181To240),
      },
      {
        accessorKey: "aging241To365",
        header: "241-365",
        cell: ({ row }) => formatCurrency(row.original.aging241To365),
      },
      {
        accessorKey: "aging366To540",
        header: "366-540",
        cell: ({ row }) => formatCurrency(row.original.aging366To540),
      },
      {
        accessorKey: "agingAbove540",
        header: ">540",
        cell: ({ row }) => formatCurrency(row.original.agingAbove540),
      },
      {
        id: "zmComment",
        header: "ZM Comment",
        cell: ({ row }) => <CommentCell value={row.original.zmComment} placeholder="Add ZM comment" onSave={(value) => onCommentSave(row.original.id, "zmComment", value)} />,
      },
      {
        id: "staffComment",
        header: "Staff Comment",
        cell: ({ row }) => (
          <CommentCell value={row.original.staffComment} placeholder="Add staff comment" onSave={(value) => onCommentSave(row.original.id, "staffComment", value)} />
        ),
      },
    ],
    [onCommentSave],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const columnClassMap: Record<string, string> = {
    vp: "min-w-[12rem] sticky left-0 z-20 bg-white",
    state: "min-w-[10rem] md:sticky md:left-[12rem] md:z-20 md:bg-white",
    staff: "min-w-[11rem]",
    partyId: "min-w-[10rem]",
    party: "min-w-[15rem]",
    month: "min-w-[8rem]",
    totalOutstanding: "min-w-[10rem]",
    aging121To150: "min-w-[8rem]",
    aging151To180: "min-w-[8rem]",
    aging181To240: "min-w-[8rem]",
    aging241To365: "min-w-[8rem]",
    aging366To540: "min-w-[8rem]",
    agingAbove540: "min-w-[8rem]",
    zmComment: "min-w-[18rem]",
    staffComment: "min-w-[18rem]",
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:hidden">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-950">{row.vp}</p>
                  <p className="text-sm text-slate-500">{row.state} · {row.staff}</p>
                  <p className="mt-1 text-sm text-slate-500">{row.party}</p>
                  <p className="text-xs text-slate-400">Party Id: {row.partyId}</p>
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-100">{row.month} {row.year}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Total O/S</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(row.totalOutstanding)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">121-150</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(row.aging121To150)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">151-180</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(row.aging151To180)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">181-240</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(row.aging181To240)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">241-365</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(row.aging241To365)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">366+ aging</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(row.aging366To540 + row.agingAbove540)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <CommentCell value={row.zmComment} placeholder="Add ZM comment" onSave={(value) => onCommentSave(row.id, "zmComment", value)} />
                <CommentCell value={row.staffComment} placeholder="Add staff comment" onSave={(value) => onCommentSave(row.id, "staffComment", value)} />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">No records match the current filters.</div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)] lg:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="sticky top-0 z-30 bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const key = header.column.id;
                  return (
                    <th key={header.id} className={cn("border-b border-slate-200 px-4 py-4 font-medium", columnClassMap[key])}>
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <Button variant="ghost" size="sm" className="-ml-3 h-auto px-3 py-2 text-xs tracking-[0.18em] text-slate-500 hover:text-slate-900" onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? <ArrowUpWideNarrow className="ml-2 h-4 w-4" /> : <ArrowDownWideNarrow className="ml-2 h-4 w-4" />}
                        </Button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-blue-50/45">
                  {row.getVisibleCells().map((cell) => {
                    const key = cell.column.id;
                    return (
                    <td key={cell.id} className={cn("border-t border-slate-100 px-4 py-4", columnClassMap[key], key === "vp" || key === "state" ? "shadow-[8px_0_12px_-12px_rgba(15,23,42,0.12)]" : "")}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-slate-500">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}