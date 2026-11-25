"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, LogOut, MessageSquare, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import DocumentCard from "@/components/DocumentCard";
import UploadBox from "@/components/UploadBox";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { api, getErrorMessage } from "@/lib/api";
import { Conversation } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth(true);
  const { documents, loading: docsLoading, uploading, uploadDocument, deleteDocument } =
    useDocuments();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [startingDocId, setStartingDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .get<Conversation[]>("/conversations")
      .then((res) => setConversations(res.data))
      .catch(() => {});
  }, [user]);

  const handleStartChat = async (docId: string) => {
    setStartingDocId(docId);
    try {
      const res = await api.post<Conversation>("/conversations", {
        document_id: docId,
      });
      router.push(`/chat/${res.data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not start conversation"));
      setStartingDocId(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900">DocuMind AI</h1>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Upload a PDF</h2>
              <p className="text-xs text-slate-500">
                Your documents are indexed privately for fast, page-cited Q&amp;A
              </p>
            </div>
          </div>
          <UploadBox uploading={uploading} onUpload={uploadDocument} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Your Documents ({documents.length})
            </h2>
          </div>

          {docsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Sparkles className="mx-auto mb-2 h-6 w-6 text-blue-500" />
              <p className="text-sm font-semibold text-slate-700">No PDFs uploaded yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Drop your first PDF above to start chatting with it.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  startingChat={startingDocId === doc.id}
                  onStartChat={handleStartChat}
                  onDelete={deleteDocument}
                />
              ))}
            </div>
          )}
        </section>

        {conversations.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-bold tracking-tight text-slate-900">
              Recent Conversations
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {conversations.slice(0, 6).map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-semibold text-slate-900">{conv.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
