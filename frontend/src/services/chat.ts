import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type { Conversation, ChatMessage, ChatResponse } from "@/types/chat";

export const chatService = {
  getConversations: async () => {
    const res = await api.get<APIResponse<Conversation[]>>("/chat/conversations");
    return res.data.data;
  },

  createConversation: async (cnr: string, title: string) => {
    const res = await api.post<APIResponse<Conversation>>("/chat/conversations", { cnr, title });
    return res.data.data;
  },

  getMessages: async (conversationId: string) => {
    const res = await api.get<APIResponse<ChatMessage[]>>(
      `/chat/conversations/${conversationId}/messages`
    );
    return res.data.data;
  },

  sendMessage: async (conversationId: string, message: string, orderFilename?: string) => {
    const res = await api.post<APIResponse<ChatResponse>>(
      `/chat/conversations/${conversationId}/messages`,
      { message, order_filename: orderFilename }
    );
    return res.data.data;
  },

  deleteConversation: async (conversationId: string) => {
    await api.delete(`/chat/conversations/${conversationId}`);
  },
};
