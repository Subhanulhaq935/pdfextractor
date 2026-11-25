export interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export type DocumentStatus = "uploaded" | "processing" | "ready" | "failed";

export interface DocumentItem {
  id: string;
  filename: string;
  file_size: number;
  page_count: number;
  status: DocumentStatus;
  created_at: string;
}

export interface Conversation {
  id: string;
  document_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface SourceReference {
  page: number;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources: SourceReference[] | null;
  created_at: string;
}
