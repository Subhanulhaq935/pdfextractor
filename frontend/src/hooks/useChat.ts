"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "@/lib/api";
import { ChatMessage, Conversation } from "@/lib/types";

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get<Conversation[]>("/conversations");
      setConversations(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load conversations"));
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const res = await api.get<ChatMessage[]>(`/conversations/${conversationId}/messages`);
      setMessages(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load messages"));
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversations();
    fetchMessages();
  }, [fetchConversations, fetchMessages]);

  const sendMessage = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || sending) return false;

    const optimisticUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: "user",
      content: trimmed,
      sources: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setSending(true);

    try {
      const res = await api.post<ChatMessage>(`/conversations/${conversationId}/messages`, {
        question: trimmed,
      });
      setMessages((prev) => [...prev, res.data]);
      fetchConversations();
      return true;
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
      toast.error(getErrorMessage(err, "Failed to get an answer"));
      return false;
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    conversations,
    loading,
    sending,
    sendMessage,
    fetchConversations,
  };
}
