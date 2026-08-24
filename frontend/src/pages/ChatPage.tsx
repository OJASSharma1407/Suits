import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { chatService } from "@/services/chat";
import type { Conversation, ChatMessage } from "@/types/chat";
import { toast } from "sonner";

export default function ChatPage() {
  const { conversationId: urlConversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(urlConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const streamAbortRef = useRef<AbortController | null>(null);

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
      if (!activeId && data.length > 0) {
        setActiveId(data[0].id);
      }
    } catch {
      // Silently handle
    }
  };

  const loadMessages = async (id: string) => {
    try {
      const msgs = await chatService.getMessages(id);
      setMessages(msgs || []);
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync activeId with URL param when it changes
  useEffect(() => {
    if (urlConversationId) {
      setActiveId(urlConversationId);
    }
  }, [urlConversationId]);

  useEffect(() => {
    if (activeId) {
      loadMessages(activeId);
    } else {
      setMessages([]);
    }
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewChat = async () => {
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
    } catch {
      toast.error("Failed to start new chat.");
    }
  };

  const handleSendMessage = async (text: string) => {
    let targetId = activeId;
    if (!targetId) {
      try {
        const newConv = await chatService.createConversation("GENERAL", "General Legal Research");
        setConversations((prev) => [newConv, ...prev]);
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
      (err) => {
        if (err !== "AbortError") {
          toast.error(err || "Error receiving response.");
        }
        setLoading(false);
        setStreamingContent("");
      }
    );
    streamAbortRef.current = controller;
  };

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
