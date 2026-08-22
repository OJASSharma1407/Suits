import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";

export interface CaseHistoryItem {
  id: string;
  cnr: string;
  title: string;
  viewed_at: string;
}

export interface ConversationHistoryItem {
  id: string;
  cnr: string;
  title: string;
  updated_at: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  type?: string;
  created_at: string;
}

export const historyService = {
  // Case View History (Cases the user opened)
  getCases: async (): Promise<CaseHistoryItem[]> => {
    const res = await api.get<APIResponse<CaseHistoryItem[]>>("/history/cases");
    return res.data.data ?? [];
  },

  recordCaseView: async (cnr: string, title?: string): Promise<void> => {
    const cleanCnr = String(cnr || "").trim();
    if (!cleanCnr) return;
    const cleanTitle = title && String(title).trim() ? String(title).trim() : "Untitled Case";
    await api.post("/history/cases", { cnr: cleanCnr, title: cleanTitle });
  },

  clearCaseHistory: async (): Promise<void> => {
    await api.delete("/history/cases");
  },

  deleteCaseView: async (cnr: string): Promise<void> => {
    const cleanCnr = String(cnr || "").trim();
    if (!cleanCnr) return;
    await api.delete(`/history/cases/${cleanCnr}`);
  },

  // Conversation & Search History
  getConversations: async (): Promise<ConversationHistoryItem[]> => {
    const res = await api.get<APIResponse<ConversationHistoryItem[]>>("/history/conversations");
    return res.data.data ?? [];
  },

  getSearches: async (): Promise<SearchHistoryItem[]> => {
    const res = await api.get<APIResponse<SearchHistoryItem[]>>("/history/searches");
    return res.data.data ?? [];
  },

  clearSearchHistory: async (): Promise<void> => {
    await api.delete("/history/searches");
  },
};
