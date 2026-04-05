"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CommentCellProps {
  value: string;
  placeholder: string;
  onSave: (value: string) => Promise<void>;
}

export function CommentCell({ value, placeholder, onSave }: CommentCellProps) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-[220px]">
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            placeholder={placeholder}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span className="ml-2">Save</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className={cn("group flex min-h-20 w-full items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-blue-200 hover:bg-blue-50") }>
          <span className="pr-3 text-sm leading-6 text-slate-700">{value || placeholder}</span>
          <PencilLine className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-blue-600" />
        </button>
      )}
    </div>
  );
}