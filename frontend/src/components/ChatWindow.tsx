"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import MessageBubble from "./MessageBubble";

interface ChatWindowProps {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  onSend: (question: string) => Promise<boolean>;
}

const STARTER_PROMPTS = [
  "Summarize this document in bullet points",
  "What are the main topics covered?",
  "List any key steps or requirements",
];

export default function ChatWindow({
  messages,
  loading,
  sending,
  onSend,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input;
    setInput("");
    const ok = await onSend(text);
    if (!ok) setInput(text);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/70">
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Ask anything about this PDF</h2>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Answers are grounded strictly in your document with clickable page citations.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => onSend(prompt)}
                    disabled={sending}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}

          {sending && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-500 shadow-sm">
                <span>Searching PDF &amp; writing answer</span>
                <span className="inline-flex gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200/80 bg-white/95 p-3 backdrop-blur sm:p-4"
      >
        <div className="mx-auto flex max-w-4xl items-center gap-2 rounded-2xl border border-slate-300 bg-white p-1.5 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your PDF..."
            disabled={sending}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
