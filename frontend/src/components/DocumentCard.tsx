"use client";

import { useState } from "react";
import { Calendar, FileText, Layers, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { DocumentItem } from "@/lib/types";

interface DocumentCardProps {
  doc: DocumentItem;
  startingChat: boolean;
  onStartChat: (docId: string) => void;
  onDelete: (docId: string) => Promise<boolean>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DocumentCard({
  doc,
  startingChat,
  onStartChat,
  onDelete,
}: DocumentCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusStyles: Record<DocumentItem["status"], string> = {
    uploaded: "bg-slate-100 text-slate-700 border-slate-200",
    processing: "bg-amber-50 text-amber-700 border-amber-200",
    ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    await onDelete(doc.id);
    setDeleting(false);
    setConfirming(false);
  };

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div>
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-600 ring-1 ring-blue-100">
              <FileText className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <h3 className="truncate text-sm font-bold text-slate-900" title={doc.filename}>
                {doc.filename}
              </h3>
              <p className="text-xs text-slate-400">{formatBytes(doc.file_size)}</p>
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusStyles[doc.status]}`}
          >
            {(doc.status === "processing" || doc.status === "uploaded") && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {doc.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {doc.page_count > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              {doc.page_count} pages
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {new Date(doc.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
        {confirming ? (
          <div className="flex w-full items-center justify-between gap-2">
            <span className="text-xs font-semibold text-red-600">Delete PDF?</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-3 w-3 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => onStartChat(doc.id)}
              disabled={doc.status !== "ready" || startingChat}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-500 disabled:shadow-none"
            >
              {startingChat ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5" />
              )}
              {doc.status === "ready" ? "Chat with PDF" : "Indexing..."}
            </button>

            <button
              onClick={() => setConfirming(true)}
              title="Delete document"
              className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
