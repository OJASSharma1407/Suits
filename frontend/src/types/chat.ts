// Chat types
export interface Conversation {
  id: string;
  cnr: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  message: string;
  created_at: string;
  timestamp?: string;
}

export interface ChatResponse {
  answer: string;
  suggested_questions: string[];
  sources: string[];
  conversation_id: string;
}

export interface Bookmark {
  id: string;
  cnr: string;
  title: string;
  bookmarked_at: string;
}
