"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, LogIn, RefreshCw, Sparkles, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import ChatWindow from "@/components/ChatWindow";
import UploadBox from "@/components/UploadBox";
import { api, getErrorMessage } from "@/lib/api";
import { ChatMessage, SourceReference } from "@/lib/types";

interface GuestDoc {
  guest_doc_id: string;
  filename: string;
  file_size: number;
  page_count: number;
}

export default function GuestPage() {
  const [guestDoc, setGuestDoc] = useState<GuestDoc | null>(null);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await api.post<GuestDoc>("/guest/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setGuestDoc(res.data);
      setMessages([]);
      toast.success(`"${res.data.filename}" ready for chat!`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to process PDF"));
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    if (guestDoc) {
      api.delete(`/guest/documents/${guestDoc.guest_doc_id}`).catch(() => {});
    }
    setGuestDoc(null);
    setMessages([]);
  };

  const handleSend = async (question: string) => {
    if (!guestDoc || sending) return false;
    const trimmed = question.trim();
    if (!trimmed) return false;

    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const userMsg: ChatMessage = {
      id: `guest-u-${Date.now()}`,
      conversation_id: "guest",
      role: "user",
      content: trimmed,
      sources: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await api.post<{ answer: string; sources: SourceReference[] }>(
        "/guest/ask",
        {
          guest_doc_id: guestDoc.guest_doc_id,
          question: trimmed,
          history: historyPayload,
        }
      );

      const assistantMsg: ChatMessage = {
        id: `guest-a-${Date.now()}`,
        conversation_id: "guest",
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      return true;
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      toast.error(getErrorMessage(err, "Failed to get an answer"));
      return false;
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900">DocuMind AI</h1>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                  Guest Mode • Not Saved
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sign in anytime to save your PDFs &amp; chat history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Register
            </Link>
          </div>
        </div>
      </header>

      {!guestDoc ? (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-8">
          <div className="mb-7 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Instant Guest Session
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Chat with any PDF instantly
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              No account needed. Upload a PDF, ask questions, and see exact page references.
              Your temporary chat disappears when you leave or refresh.
            </p>
          </div>
          <UploadBox uploading={uploading} onUpload={handleUpload} />
        </main>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <span className="truncate text-sm font-bold text-slate-800">
                {guestDoc.filename}
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {guestDoc.page_count} pages
              </span>
            </div>

            <button
              onClick={handleReset}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              New PDF
            </button>
          </div>

          <ChatWindow
            messages={messages}
            loading={false}
            sending={sending}
            onSend={handleSend}
          />
        </div>
      )}
    </div>
  );
}
