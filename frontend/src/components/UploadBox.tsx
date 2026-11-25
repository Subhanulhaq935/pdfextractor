"use client";

import { DragEvent, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface UploadBoxProps {
  uploading: boolean;
  onUpload: (file: File) => Promise<unknown>;
}

const MAX_MB = 20;

export default function UploadBox({ uploading, onUpload }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a valid .pdf file");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File must be smaller than ${MAX_MB} MB`);
      return;
    }
    await onUpload(file);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    await handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`group cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
        dragging
          ? "scale-[1.01] border-blue-500 bg-blue-50/80 shadow-lg shadow-blue-500/10"
          : "border-slate-300 bg-white shadow-sm hover:border-blue-400 hover:bg-gradient-to-b hover:from-white hover:to-blue-50/30 hover:shadow-md"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 transition-transform group-hover:scale-105">
        {uploading ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : (
          <FileUp className="h-7 w-7" />
        )}
      </div>
      <p className="text-base font-bold text-slate-900">
        {uploading ? "Uploading & indexing PDF..." : "Drop your PDF here, or click to browse"}
      </p>
      <p className="mt-1.5 text-xs text-slate-500">
        Supports selectable-text PDFs up to <span className="font-semibold">{MAX_MB} MB</span>
      </p>
    </div>
  );
}
