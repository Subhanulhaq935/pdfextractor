"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Loader2, Menu } from "lucide-react";
import ChatWindow from "@/components/ChatWindow";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;

  const { user, loading: authLoading, logout } = useAuth(true);
  const { messages, conversations, documentNames, loading, sending, sendMessage } =
    useChat(conversationId);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeConv = conversations.find((c) => c.id === conversationId);
  const activePdfName = activeConv ? documentNames[activeConv.document_id] : undefined;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        conversations={conversations}
        documentNames={documentNames}
        activeId={conversationId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="overflow-hidden">
            <h1 className="truncate text-sm font-bold text-slate-900">
              {activeConv?.title || "PDF Chat"}
            </h1>
            <p className="flex items-center gap-1 truncate text-xs text-slate-500">
              {activePdfName ? (
                <>
                  <FileText className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                  <span className="truncate font-medium text-slate-700">{activePdfName}</span>
                </>
              ) : (
                "Answers grounded in your uploaded PDF"
              )}
            </p>
          </div>
        </header>

        <ChatWindow
          messages={messages}
          loading={loading}
          sending={sending}
          onSend={sendMessage}
        />
      </div>
    </div>
  );
}
