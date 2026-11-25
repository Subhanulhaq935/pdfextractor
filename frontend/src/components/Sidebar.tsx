"use client";

import Link from "next/link";
import { ArrowLeft, LogOut, MessageSquare, Plus, X } from "lucide-react";
import { Conversation } from "@/lib/types";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  open,
  onClose,
  onLogout,
}: SidebarProps) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-bold text-slate-800 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3">
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Saved History
          </p>
          <div className="space-y-1">
            {conversations.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-400">No conversations yet.</p>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === activeId;
                return (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                      isActive
                        ? "bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-100"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
