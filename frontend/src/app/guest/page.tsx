"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, LogIn, RefreshCw, UserPlus } from "lucide-react";
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">AI PDF Q&amp;A</h1>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  Guest Mode (Not Saved)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sign in to save your PDFs and chat history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Register
            </Link>
          </div>
        </div>
      </header>

      {!guestDoc ? (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Chat with any PDF instantly</h2>
            <p className="mt-1 text-sm text-slate-500">
              No login required. Your temporary chat disappears when you leave or refresh.
            </p>
          </div>
          <UploadBox uploading={uploading} onUpload={handleUpload} />
        </main>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/70 px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="truncate text-sm font-semibold text-slate-800">
                {guestDoc.filename}
              </span>
              <span className="shrink-0 text-xs text-slate-500">
                ({guestDoc.page_count} pages)
              </span>
            </div>

            <button
              onClick={handleReset}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
