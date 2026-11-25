"use client";

import { useState } from "react";
import { FileText, Loader2, MessageSquare, Trash2 } from "lucide-react";
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
    uploaded: "bg-slate-100 text-slate-700",
    processing: "bg-amber-100 text-amber-800",
    ready: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-red-700",
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    await onDelete(doc.id);
    setDeleting(false);
    setConfirming(false);
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="truncate text-sm font-semibold text-slate-900" title={doc.filename}>
              {doc.filename}
            </h3>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[doc.status]}`}
          >
            {(doc.status === "processing" || doc.status === "uploaded") && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {doc.status}
          </span>
        </div>

        <div className="space-y-1 text-xs text-slate-500">
          <p>
            Size: <span className="font-medium text-slate-700">{formatBytes(doc.file_size)}</span>
            {doc.page_count > 0 && (
              <>
                {" • "}Pages: <span className="font-medium text-slate-700">{doc.page_count}</span>
              </>
            )}
          </p>
          <p>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        {confirming ? (
          <div className="flex w-full items-center justify-between gap-2">
            <span className="text-xs font-medium text-red-600">Delete PDF?</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
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
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {startingChat ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5" />
              )}
              {doc.status === "ready" ? "Chat with PDF" : "Processing..."}
            </button>

            <button
              onClick={() => setConfirming(true)}
              title="Delete document"
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
