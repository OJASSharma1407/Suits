import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type { Conversation, ChatMessage, ChatResponse } from "@/types/chat";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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

  /**
   * Stream AI response tokens via SSE (fetch + ReadableStream).
   *
   * @param conversationId  The active conversation UUID
   * @param message         The user's message text
   * @param onToken         Called with each partial token string as it arrives
   * @param onDone          Called once streaming finishes with the suggested questions list
   * @param onError         Called if the stream errors
   * @param orderFilename   Optional order filename for context
   * @returns               An AbortController — call `.abort()` to cancel
   */
  streamMessage: (
    conversationId: string,
    message: string,
    onToken: (token: string) => void,
    onDone: (suggestedQuestions: string[]) => void,
    onError: (err: string) => void,
    orderFilename?: string,
  ): AbortController => {
    const controller = new AbortController();

    const doStream = async (accessToken: string): Promise<boolean> => {
      const response = await fetch(
        `${BASE_URL}/chat/conversations/${conversationId}/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ message, order_filename: orderFilename }),
          signal: controller.signal,
        }
      );

      if (response.status === 401) {
        return false; // signal caller to refresh token and retry
      }

      if (!response.ok || !response.body) {
        onError(`Server error: ${response.status}`);
        return true;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim());
            if (payload.token !== undefined) {
              onToken(payload.token);
            } else if (payload.done) {
              onDone(payload.suggested_questions ?? []);
            } else if (payload.error) {
              onError(payload.error);
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
      return true;
    };

    const run = async () => {
      try {
        let token = localStorage.getItem("access_token") ?? "";
        const ok = await doStream(token);

        if (!ok) {
          // 401 — try to refresh the token once
          const refreshToken = localStorage.getItem("refresh_token");
          if (refreshToken) {
            try {
              const res = await fetch(
                `${BASE_URL}/auth/refresh`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ refresh_token: refreshToken }),
                }
              );
              if (res.ok) {
                const data = await res.json();
                const newToken = data?.data?.access_token;
                if (newToken) {
                  localStorage.setItem("access_token", newToken);
                  if (data?.data?.refresh_token) {
                    localStorage.setItem("refresh_token", data.data.refresh_token);
                  }
                  await doStream(newToken);
                  return;
                }
              }
            } catch {
              // refresh network failure
            }
          }
          window.dispatchEvent(new Event("auth:logout"));
          onError("Session expired. Please log in again.");
        }
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          onError(String(err));
        }
      }
    };

    run();
    return controller;
  },

  deleteConversation: async (conversationId: string) => {
    await api.delete(`/chat/conversations/${conversationId}`);
  },
};
