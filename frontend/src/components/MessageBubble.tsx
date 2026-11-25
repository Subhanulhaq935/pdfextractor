"use client";

import { useState } from "react";
import { BookOpen, Bot, ChevronDown, ChevronUp, User as UserIcon } from "lucide-react";
import { ChatMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [activePage, setActivePage] = useState<number | null>(null);

  const selectedSource = message.sources?.find((s) => s.page === activePage);

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={`flex max-w-2xl flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/15"
              : "rounded-tl-sm border border-slate-200/90 bg-white text-slate-800 shadow-sm"
          }`}
        >
          {message.content}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2.5 w-full">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                Sources
              </span>
              {message.sources.map((src) => {
                const isOpen = activePage === src.page;
                return (
                  <button
                    key={src.page}
                    type="button"
                    onClick={() => setActivePage((prev) => (prev === src.page ? null : src.page))}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition ${
                      isOpen
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    Page {src.page}
                    {isOpen ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedSource && (
              <div className="mt-2 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-3.5 text-xs text-slate-700 shadow-sm">
                <p className="mb-1 font-bold text-blue-800">
                  Excerpt from Page {selectedSource.page}
                </p>
                <p className="italic leading-relaxed text-slate-600">
                  &ldquo;{selectedSource.snippet}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
          <UserIcon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
