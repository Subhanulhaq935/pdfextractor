"use client";

import { useState } from "react";
import { BookOpen, Bot, User as UserIcon } from "lucide-react";
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={`max-w-2xl ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-white text-slate-800"
          }`}
        >
          {message.content}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 w-full">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                <BookOpen className="h-3.5 w-3.5" />
                Sources:
              </span>
              {message.sources.map((src) => (
                <button
                  key={src.page}
                  type="button"
                  onClick={() =>
                    setActivePage((prev) => (prev === src.page ? null : src.page))
                  }
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
                    activePage === src.page
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  Page {src.page}
                </button>
              ))}
            </div>

            {selectedSource && (
              <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-700">
                <p className="mb-1 font-semibold text-blue-800">
                  Page {selectedSource.page} snippet:
                </p>
                <p className="leading-relaxed">{selectedSource.snippet}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
          <UserIcon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
