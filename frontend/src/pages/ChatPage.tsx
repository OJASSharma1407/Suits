import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { chatService } from "@/services/chat";
import type { Conversation, ChatMessage } from "@/types/chat";
import { toast } from "sonner";
import { useDictationStore } from "@/store/dictation-store";

export default function ChatPage() {
  const { conversationId: urlConversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(urlConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const streamAbortRef = useRef<AbortController | null>(null);
  const lastProcessedPromptRef = useRef<string | null>(null);

  const { pendingFullScreenPrompt, setPendingFullScreenPrompt } = useDictationStore();

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      const list = data || [];
      setConversations(list);

      // Validate urlConversationId against actual database conversations
      if (urlConversationId) {
        const exists = list.some((c) => c.id === urlConversationId);
        if (!exists) {
          // Stale or non-existent conversation in URL: reset to first valid or clear
          if (list.length > 0) {
            setActiveId(list[0].id);
            navigate(`/chat/${list[0].id}`, { replace: true });
          } else {
            setActiveId(undefined);
            navigate("/chat", { replace: true });
          }
        } else {
          setActiveId(urlConversationId);
        }
      } else if (list.length > 0 && !location.state?.autoPrompt && !pendingFullScreenPrompt) {
        // If on /chat and no auto-prompt is waiting, open most recent conversation
        setActiveId(list[0].id);
      }
    } catch {
      // Silently handle
    }
  };

  const loadMessages = async (id: string) => {
    try {
      const msgs = await chatService.getMessages(id);
      setMessages(msgs || []);
    } catch (err: any) {
      // If conversation returned 404 (deleted or invalid), cleanly detach from it
      if (err?.response?.status === 404) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        setActiveId(undefined);
        setMessages([]);
        navigate("/chat", { replace: true });
        return;
      }
      setMessages([]);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep activeId strictly in sync with the URL
  useEffect(() => {
    if (urlConversationId) {
      setActiveId(urlConversationId);
    } else {
      setActiveId(undefined);
      setMessages([]);
    }
  }, [urlConversationId]);

  useEffect(() => {
    if (activeId) {
      loadMessages(activeId);
    } else {
      setMessages([]);
    }
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewChat = async (): Promise<string | undefined> => {
    try {
      streamAbortRef.current?.abort();
      setStreamingContent("");
      setSuggestedQuestions([]);
      const newConv = await chatService.createConversation("GENERAL", "General Legal Research");
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      setMessages([]);
      navigate(`/chat/${newConv.id}`, { replace: true });
      toast.success("New legal research chat started.");
      return newConv.id;
    } catch {
      toast.error("Failed to start new chat.");
      return undefined;
    }
  };

  const handleSendMessage = useCallback(
    async (text: string, forceNew = false) => {
      let targetId = forceNew ? undefined : activeId;

      // Verify targetId actually exists in our valid conversations list
      if (!targetId || !conversations.some((c) => c.id === targetId)) {
        try {
          const newConv = await chatService.createConversation("GENERAL", "General Legal Research");
          setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
          targetId = newConv.id;
          setActiveId(targetId);
          navigate(`/chat/${targetId}`, { replace: true });
        } catch {
          toast.error("Failed to initialize chat session.");
          return;
        }
      }

      streamAbortRef.current?.abort();
      setStreamingContent("");
      setSuggestedQuestions([]);
      setLoading(true);

      const userMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        message: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const convoId = targetId;
      let accumulated = "";
      const controller = chatService.streamMessage(
        convoId,
        text,
        (token) => {
          accumulated += token;
          setStreamingContent(accumulated);
        },
        (questions) => {
          const assistantMsg: ChatMessage = {
            id: `server-${Date.now()}`,
            role: "assistant",
            message: accumulated,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent("");
          setSuggestedQuestions(questions || []);
          setLoading(false);
        },
        async (err) => {
          if (err !== "AbortError") {
            // Self-healing: if targetId 404'd, create a fresh conversation and auto-retry
            if (err && err.includes("404")) {
              try {
                const freshConv = await chatService.createConversation("GENERAL", "General Legal Research");
                setConversations((prev) => [freshConv, ...prev.filter((c) => c.id !== convoId)]);
                setActiveId(freshConv.id);
                navigate(`/chat/${freshConv.id}`, { replace: true });
                // Re-stream on the fresh conversation
                chatService.streamMessage(
                  freshConv.id,
                  text,
                  (token) => {
                    accumulated += token;
                    setStreamingContent(accumulated);
                  },
                  (questions) => {
                    const assistantMsg: ChatMessage = {
                      id: `server-${Date.now()}`,
                      role: "assistant",
                      message: accumulated,
                      created_at: new Date().toISOString(),
                    };
                    setMessages((prev) => [...prev, assistantMsg]);
                    setStreamingContent("");
                    setSuggestedQuestions(questions || []);
                    setLoading(false);
                  },
                  () => {
                    setLoading(false);
                    setStreamingContent("");
                  }
                );
                return;
              } catch {
                toast.error("Error connecting to chat session.");
              }
            } else {
              toast.error(err || "Error receiving response.");
            }
          }
          setLoading(false);
          setStreamingContent("");
        }
      );
      streamAbortRef.current = controller;
    },
    [activeId, conversations, navigate]
  );

  // Handle incoming voice dictation query (both on initial navigation and while on page)
  useEffect(() => {
    const promptFromState = (location.state as { autoPrompt?: string } | null)?.autoPrompt;
    const promptFromStore = pendingFullScreenPrompt;
    const promptToSend = promptFromState || promptFromStore;

    if (promptToSend && promptToSend !== lastProcessedPromptRef.current) {
      lastProcessedPromptRef.current = promptToSend;

      if (promptFromState) {
        window.history.replaceState({}, document.title);
      }
      if (promptFromStore) {
        setPendingFullScreenPrompt(null);
      }

      // If user navigated directly to /chat without a conversation ID, start fresh session
      const forceNew = !urlConversationId;
      handleSendMessage(promptToSend, forceNew);
    }
  }, [
    location.state,
    pendingFullScreenPrompt,
    urlConversationId,
    handleSendMessage,
    setPendingFullScreenPrompt,
  ]);

  const handleDeleteConversation = async (id: string) => {
    try {
      await chatService.deleteConversation(id);
      toast.info("Conversation deleted.");
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (activeId === id) {
        const nextId = updated[0]?.id;
        setActiveId(nextId);
        if (nextId) {
          navigate(`/chat/${nextId}`, { replace: true });
        } else {
          navigate("/chat", { replace: true });
        }
      }
    } catch {
      toast.error("Failed to delete conversation.");
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    navigate(`/chat/${id}`);
  };

  return (
    <div
      className="flex overflow-hidden rounded-2xl border"
      style={{
        height: "calc(100vh - var(--header-height, 64px) - 48px)",
        borderColor: "var(--border)",
        background: "var(--card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
      />
      <div className="flex-1 p-3 sm:p-4 overflow-hidden h-full flex flex-col">
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={loading}
          streamingMessage={streamingContent}
          suggestedQuestions={suggestedQuestions}
          onClearChat={handleNewChat}
        />
      </div>
    </div>
  );
}
