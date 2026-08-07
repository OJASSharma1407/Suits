import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { chatService } from "@/services/chat";
import type { Conversation, ChatMessage } from "@/types/chat";
import { toast } from "sonner";

export default function ChatPage() {
  const { conversationId: urlConversationId } = useParams<{ conversationId: string }>();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(urlConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

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
      setMessages(msgs);
    } catch {
      toast.error("Failed to load messages.");
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

  const handleSendMessage = async (text: string) => {
    if (!activeId) return;
    setLoading(true);
    try {
      await chatService.sendMessage(activeId, text);
      await loadMessages(activeId);
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await chatService.deleteConversation(id);
      toast.info("Conversation deleted.");
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (activeId === id) {
        setActiveId(updated[0]?.id);
      }
    } catch {
      toast.error("Failed to delete conversation.");
    }
  };

  return (
    <div
      className="flex overflow-hidden card-float"
      style={{ height: "calc(100vh - var(--header-height) - 80px)" }}
    >
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => setActiveId(id)}
        onNew={() => {
          toast.info("Open a case from search to start a new chat!");
        }}
        onDelete={handleDeleteConversation}
      />
      <div className="flex-1 p-4">
        {activeId ? (
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={loading}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
            Select a conversation to continue research.
          </div>
        )}
      </div>
    </div>
  );
}
