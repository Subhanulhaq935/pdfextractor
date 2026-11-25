"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, LogOut, MessageSquare } from "lucide-react";
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">AI PDF Q&amp;A</h1>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">Upload a PDF</h2>
          <UploadBox uploading={uploading} onUpload={uploadDocument} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">Your Documents</h2>
          {docsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No PDFs uploaded yet. Upload your first document above to start asking questions.
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
            <h2 className="mb-3 text-lg font-bold text-slate-900">Recent Conversations</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {conversations.slice(0, 6).map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-semibold text-slate-900">{conv.title}</p>
                    <p className="text-xs text-slate-500">
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
