import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquare,
  X,
  Sparkles,
  RotateCcw,
  Bot,
} from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { chatService } from "@/services/chat";
import type { ChatMessage } from "@/types/chat";
import { toast } from "sonner";

interface DocumentChatDrawerProps {
  documentTitle?: string;
  onInsertText?: (text: string) => void;
  isFullscreen?: boolean;
}

const DRAFTING_SUGGESTIONS = [
  "Suggest grounds for quashing FIR under Section 528 BNSS / 482 CrPC",
  "Draft standard prayer clause for anticipatory bail",
  "Explain Section 8 General Clauses Act transposition",
  "What are the mandatory elements of an affidavit verification?",
  "Draft an interim stay application clause",
];

const LOCAL_STORAGE_CHAT_KEY = "suits_document_chat_history";

export const DocumentChatDrawer: React.FC<DocumentChatDrawerProps> = ({
  documentTitle = "Legal Document",
  isFullscreen = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: "welcome-1",
        role: "assistant",
        message:
          "Hello! I am your Suits Legal Drafting Assistant. Ask me about Indian court formats, statutory grounds under BNS/BNSS, governing landmark precedents, or request custom legal clauses to insert into your document.",
        created_at: new Date().toISOString(),
      },
    ];
  });

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(DRAFTING_SUGGESTIONS);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Persist chat history
  useEffect(() => {
    try {
      if (messages.length > 0 && !streamingContent) {
        localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
      }
    } catch {
      // ignore
    }
  }, [messages, streamingContent]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      message: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setStreamingContent("");

    try {
      let activeConvoId = conversationId;
      if (!activeConvoId) {
        try {
          const newConvo = await chatService.createConversation(
            "LEGAL_DOCUMENT",
            documentTitle || "Legal Drafting"
          );
          if (newConvo?.id) {
            activeConvoId = newConvo.id;
            setConversationId(activeConvoId);
          }
        } catch {
          // Backend conversation creation failed — continue with fallback
        }
      }

      if (activeConvoId) {
        let accumulated = "";
        const controller = chatService.streamMessage(
          activeConvoId,
          text,
          (token) => {
            accumulated += token;
            setStreamingContent(accumulated);
          },
          (followUps) => {
            const assistantMsg: ChatMessage = {
              id: `asst-${Date.now()}`,
              role: "assistant",
              message: accumulated,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setStreamingContent("");
            setLoading(false);
            if (followUps && followUps.length > 0) {
              setSuggestedQuestions(followUps);
            }
          },
          (errorMsg) => {
            handleFallbackResponse(text);
          }
        );
        abortControllerRef.current = controller;
      } else {
        // Local drafting knowledge fallback
        handleFallbackResponse(text);
      }
    } catch {
      handleFallbackResponse(text);
    }
  };

  const handleFallbackResponse = (query: string) => {
    setTimeout(() => {
      let reply = "";
      const q = query.toLowerCase();

      if (q.includes("quash") || q.includes("528") || q.includes("482")) {
        reply =
          `**Grounds for Quashing under Section 528 BNSS (erstwhile 482 CrPC):**\n\n` +
          `1. **State of Haryana v. Bhajan Lal (1992 Supp (1) SCC 335):**\n` +
          `   - Where allegations in the FIR, even if taken at face value, do not disclose a cognizable offence.\n` +
          `   - Where uncontroverted allegations and evidence collected fail to disclose the commission of any offence.\n` +
          `   - Where criminal proceeding is manifestly attended with mala fide or instituted maliciously with an ulterior motive for wreaking vengeance.\n\n` +
          `2. **Section 8 General Clauses Act, 1897:** Pari materia jurisprudence under 482 CrPC strictly continues under Section 528 BNSS.`;
      } else if (q.includes("bail") || q.includes("482") || q.includes("438")) {
        reply =
          `**Standard Anticipatory Bail Prayer Clause (Sec 482 BNSS / 438 CrPC):**\n\n` +
          `"In the premises aforesaid, it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:\n` +
          `(a) Direct that in the event of arrest of the Applicant/Petitioner in connection with FIR No. [____]/2026, registered at P.S. [____] under Sections [____], the Applicant be released on bail on furnishing a personal bond with one surety to the satisfaction of the Investigating Officer/Arresting Officer;\n` +
          `(b) Direct that the Applicant shall join investigation as and when directed;\n` +
          `(c) Pass such other or further order(s) as this Hon'ble Court may deem fit and proper in the interest of justice."`;
      } else if (q.includes("verification") || q.includes("affidavit")) {
        reply =
          `**Standard Indian Verification Format for Affidavits:**\n\n` +
          `"VERIFICATION:\n` +
          `Verified at [City] on this [Day] day of [Month], 2026 that the contents of paragraphs 1 to [__] of the above petition are true and correct to my personal knowledge derived from the official records maintained in the ordinary course of business, and nothing material has been concealed or falsely stated therefrom.\n\n` +
          `DEPONENT"`;
      } else {
        reply =
          `Regarding your legal query on "${query}":\n\n` +
          `Under Indian court procedure, pleadings must be concise, state material facts (not evidence), and follow the hierarchical statutory framework. You can use the **Indian Court Formats** menu in the editor toolbar to insert Cause Titles, Memo of Parties, Grounds, and Prayers.`;
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        message: reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingContent("");
      setLoading(false);
    }, 600);
  };

  const handleClearChat = () => {
    if (confirm("Clear chat history?")) {
      const welcome: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        message: "Chat cleared. What drafting or legal research questions can I help you with?",
        created_at: new Date().toISOString(),
      };
      setMessages([welcome]);
      localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
      toast.info("Chat history cleared");
    }
  };

  return createPortal(
    <div
      className={`fixed z-[100000] flex flex-col items-end gap-3 pointer-events-auto transition-all duration-200 ${
        isFullscreen ? "bottom-8 right-8" : "bottom-8 right-6 sm:right-[76px]"
      }`}
    >
      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          className="w-[420px] h-[580px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{
            background: "var(--surface)",
            borderColor: "var(--hairline)",
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.45), 0 0 0 1px var(--hairline)",
          }}
        >
          {/* Header */}
          <div
            className="p-3.5 border-b flex items-center justify-between"
            style={{ borderColor: "var(--hairline-soft)", background: "var(--surface-raised)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: "var(--brass-soft)",
                  color: "var(--brass)",
                  border: "1px solid var(--hairline)",
                }}
              >
                <Sparkles size={16} />
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-xs block" style={{ color: "var(--ink)" }}>
                  Suits Legal Assistant
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Drafting & Precedent AI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation"
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Chat Panel Body */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={loading}
              streamingMessage={streamingContent}
              suggestedQuestions={suggestedQuestions}
              onClearChat={handleClearChat}
            />
          </div>
        </div>
      )}

      {/* ── Floating Action Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer relative group border border-white/15"
        style={{
          background: isOpen ? "var(--surface-container-high)" : "var(--brass)",
          color: isOpen ? "var(--ink)" : "var(--on-primary)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
        title={isOpen ? "Close Legal AI Assistant" : "Ask Suits Legal AI Assistant"}
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageSquare size={22} />
            <Sparkles
              size={11}
              className="absolute -top-1 -right-1 text-amber-300 animate-pulse"
            />
          </div>
        )}
      </button>
    </div>,
    document.body
  );
};
