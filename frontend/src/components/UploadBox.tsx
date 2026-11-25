"use client";

import { DragEvent, useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
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
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
        dragging
          ? "border-blue-500 bg-blue-50/70"
          : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/60"
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
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <UploadCloud className="h-6 w-6" />
        )}
      </div>
      <p className="text-sm font-semibold text-slate-800">
        {uploading ? "Uploading PDF..." : "Click or drag & drop a PDF here"}
      </p>
      <p className="mt-1 text-xs text-slate-500">PDF files up to {MAX_MB} MB</p>
    </div>
  );
}
