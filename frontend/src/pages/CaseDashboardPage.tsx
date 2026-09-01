import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { CaseHeader } from "@/components/case/CaseHeader";
import { Timeline } from "@/components/case/Timeline";
import { PartyCard } from "@/components/case/PartyCard";
import { JudgeCard } from "@/components/case/JudgeCard";
import { StatisticsCard } from "@/components/case/StatisticsCard";
import { DocumentLiquidNavBar } from "@/components/case/DocumentLiquidNavBar";
import { AISummaryCard } from "@/components/case/AISummaryCard";
import { DocumentReaderModal } from "@/components/case/DocumentReaderModal";
import { CitationNetworkView } from "@/components/case/citation/CitationNetworkView";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { ErrorState } from "@/components/common/ErrorState";

import { caseService } from "@/services/cases";
import { bookmarkService } from "@/services/bookmarks";
import { chatService } from "@/services/chat";
import { historyService } from "@/services/history";
import type { CaseDetails, OrderAI, OrderItem } from "@/types/case";
import type { ChatMessage } from "@/types/chat";
import type { CitationNode } from "@/types/citation";
import { Sparkles, MessageSquare, X, RotateCcw, Maximize2 } from "lucide-react";
import { toast } from "sonner";

export default function CaseDashboardPage() {
  const { cnr } = useParams<{ cnr: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedOrderFilename, setSelectedOrderFilename] = useState<string | null>(null);
  const [selectedAI, setSelectedAI] = useState<OrderAI | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // In-Built Document Reader State
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [readerCnr, setReaderCnr] = useState<string | null>(null);
  const [readerFilename, setReaderFilename] = useState<string | null>(null);
  const [readerCaseTitle, setReaderCaseTitle] = useState<string | null>(null);
  const [readerCourtName, setReaderCourtName] = useState<string | null>(null);
  const [readerOrderDate, setReaderOrderDate] = useState<string | null>(null);
  const [readerOrders, setReaderOrders] = useState<OrderItem[]>([]);
  const [readerMode, setReaderMode] = useState<"pdf" | "text">("pdf");
  const [readerAllowToggle, setReaderAllowToggle] = useState<boolean>(true);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const streamAbortRef = React.useRef<AbortController | null>(null);

  const handleClearChat = async () => {
    streamAbortRef.current?.abort();
    setStreamingContent("");
    setSuggestedQuestions([]);
    setMessages([]);
    if (cnr) {
      localStorage.removeItem(`suits_chat_${cnr}`);
      try {
        const convo = await chatService.createConversation(cnr, `Case - ${cnr}`);
        setConversationId(convo.id);
        toast.success("New chat session started.");
      } catch {
        setConversationId(null);
      }
    } else {
      setConversationId(null);
    }
  };

  const handleExpandChat = async () => {
    setIsChatOpen(false);
    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    } else if (cnr) {
      try {
        const convo = await chatService.createConversation(cnr, `Case - ${cnr}`);
        setConversationId(convo.id);
        navigate(`/chat/${convo.id}`);
      } catch {
        navigate("/chat");
      }
    } else {
      navigate("/chat");
    }
  };

  // Load chat history for the case from localStorage and backend
  const loadChatForCase = async (caseCnr: string) => {
    const localKey = `suits_chat_${caseCnr}`;
    let cachedMessages: ChatMessage[] = [];

    if (localStorage.getItem(localKey)) {
      try {
        const parsed = JSON.parse(localStorage.getItem(localKey)!);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          cachedMessages = parsed.messages;
        }
      } catch {
        // ignore parsing error
      }
    }

    // Always sync with backend first — do NOT apply cached conversationId eagerly
    // because it may refer to a deleted conversation (causes 404s).
    try {
      const convos = await chatService.getConversations();
      const matched = convos.find((c) => c.cnr === caseCnr || c.title?.includes(caseCnr));
      if (matched) {
        // Backend has a valid conversation — use it as the authoritative ID
        setConversationId(matched.id);
        const remoteMsgs = await chatService.getMessages(matched.id);
        if (remoteMsgs && remoteMsgs.length > 0) {
          setMessages(remoteMsgs);
          localStorage.setItem(localKey, JSON.stringify({ conversationId: matched.id, messages: remoteMsgs }));
        } else if (cachedMessages.length > 0) {
          // Remote conversation exists but has no messages yet — keep cached messages
          setMessages(cachedMessages);
        }
      } else {
        // No backend conversation found — clear any stale cached ID and show cached messages
        localStorage.removeItem(localKey);
        setConversationId(null);
        if (cachedMessages.length > 0) {
          setMessages(cachedMessages);
        }
      }
    } catch {
      // Backend unreachable — fall back to cached messages only (no conversationId)
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
      }
    }
  };

  // Persist messages locally whenever they change
  useEffect(() => {
    if (cnr && messages.length > 0 && !streamingContent) {
      localStorage.setItem(
        `suits_chat_${cnr}`,
        JSON.stringify({ conversationId, messages })
      );
    }
  }, [cnr, messages, conversationId, streamingContent]);

  const fetchCase = async () => {
    if (!cnr) return;
    setLoading(true);
    setError(null);
    try {
      const data = await caseService.getDetails(cnr);
      setCaseData(data);

      // Record in opened cases history
      historyService.recordCaseView(cnr, data.case_title).catch(() => {});

      // Check bookmark status separately — don't let it break case loading
      try {
        const bookmarked = await bookmarkService.check(cnr);
        setIsBookmarked(bookmarked);
      } catch {
        setIsBookmarked(false);
      }

      // Default to first valid order with a filename
      const validOrder =
        data.orders.find((o) => !o.is_stub && o.filename) || data.orders[0];
      if (validOrder?.filename) {
        setSelectedOrderFilename(validOrder.filename);
      }
    } catch {
      setError("Failed to load case details. Please check the CNR and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
    if (cnr) {
      loadChatForCase(cnr);
    }
  }, [cnr]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBookmarkToggle = async () => {
    if (!cnr || !caseData) return;
    try {
      if (isBookmarked) {
        await bookmarkService.remove(cnr);
        setIsBookmarked(false);
        toast.info("Bookmark removed.");
      } else {
        await bookmarkService.add(cnr, caseData.case_title);
        setIsBookmarked(true);
        toast.success("Case saved to bookmarks.");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      // 409: Already bookmarked — sync local state to true
      if (status === 409) {
        setIsBookmarked(true);
        toast.info("Case is already in your bookmarks.");
      // 404: Bookmark didn't exist on remove — sync local state to false
      } else if (status === 404) {
        setIsBookmarked(false);
        toast.info("Bookmark was already removed.");
      } else {
        toast.error("Failed to update bookmark. Please try again.");
      }
    }
  };

  const handleRefresh = async () => {
    if (!cnr) return;
    setIsRefreshing(true);
    try {
      await caseService.refreshCase(cnr);
      toast.success("Case refresh requested.");
      await fetchCase();
    } catch {
      toast.error("Failed to refresh case.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenAI = async (filename: string) => {
    if (!cnr) return;
    setAiLoading(true);
    try {
      const aiData = await caseService.getOrderAI(cnr, filename);
      setSelectedAI(aiData);
      toast.success("Summary loaded.");
      setTimeout(() => {
        const el = document.getElementById("ai-summary-section");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      toast.error("Summary unavailable for this order.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenReader = (filename?: string | null, initialMode: "pdf" | "text" = "pdf") => {
    const targetFile =
      filename ||
      selectedOrderFilename ||
      caseData?.orders?.find((o) => !o.is_stub && o.filename)?.filename ||
      caseData?.orders?.[0]?.filename;

    if (!targetFile) {
      toast.error("No court document available for this record.");
      return;
    }
    setReaderCnr(caseData?.cnr || "");
    setReaderFilename(targetFile);
    setReaderCaseTitle(caseData?.case_title || "Court Document");
    setReaderCourtName(caseData?.court?.court_name || "Court Record");
    setReaderOrderDate(caseData?.decision_date || caseData?.next_hearing_date || "Court Order");
    setReaderOrders(caseData?.orders || []);
    setReaderMode(initialMode);
    setReaderAllowToggle(true);
    setIsReaderOpen(true);
  };

  const handleOpenPrecedentReader = (node: CitationNode) => {
    const docId = node.tid || node.title;
    if (!docId) {
      toast.error("Precedent document identifier unavailable.");
      return;
    }
    setReaderCnr(docId);
    setReaderFilename(docId);
    setReaderCaseTitle(node.title);
    setReaderCourtName(node.court || "Precedent / Statutory Authority");
    setReaderOrderDate(node.year ? `Decided in ${node.year}` : "Legal Provision");
    setReaderOrders([]);
    setReaderMode("text");
    setReaderAllowToggle(false);
    setIsReaderOpen(true);
  };

  const handleDownloadPDF = async (filename?: string | null) => {
    if (!cnr) return;
    const targetFile =
      filename ||
      selectedOrderFilename ||
      caseData?.orders?.find((o) => !o.is_stub && o.filename)?.filename;

    if (!targetFile) {
      toast.error("No document PDF available to download.");
      return;
    }

    try {
      const { blob, filename: safeFilename } = await caseService.downloadOrderPDF(cnr, targetFile);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", safeFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started.");
    } catch {
      toast.error("Failed to download PDF.");
    }
  };

  const handleSendMessage = async (msg: string) => {
    if (!cnr) return;

    // Abort any in-progress stream
    streamAbortRef.current?.abort();
    setStreamingContent("");
    setSuggestedQuestions([]);
    setChatLoading(true);

    try {
      let activeConvoId = conversationId;
      if (!activeConvoId) {
        const convo = await chatService.createConversation(cnr, `Case - ${cnr}`);
        activeConvoId = convo.id;
        setConversationId(activeConvoId);
      }

      // Optimistically add user message to UI
      const userMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        message: msg,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const convoId = activeConvoId;
      let accumulatedAnswer = "";
      const controller = chatService.streamMessage(
        convoId,
        msg,
        (token: string) => {
          accumulatedAnswer += token;
          setStreamingContent(accumulatedAnswer);
        },
        (questions: string[]) => {
          const assistantMsg: ChatMessage = {
            id: `server-${Date.now()}`,
            role: "assistant",
            message: accumulatedAnswer,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent("");
          setSuggestedQuestions(questions || []);
          setChatLoading(false);
        },
        (err: string) => {
          if (err !== "AbortError") {
            toast.error(err || "Error receiving AI response.");
          }
          setStreamingContent("");
          setChatLoading(false);
        }
      );
      streamAbortRef.current = controller;
    } catch {
      toast.error("Failed to send message.");
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <SkeletonLoader count={1} height="180px" />
        <SkeletonLoader count={3} height="80px" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-xl mx-auto">
        <ErrorState title="Case Error" message={error || "Case details not found."} onRetry={fetchCase} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <CaseHeader
        caseData={caseData}
        isBookmarked={isBookmarked}
        onBookmarkToggle={handleBookmarkToggle}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <StatisticsCard stats={caseData.statistics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        <div className="lg:col-span-2">
          <PartyCard parties={caseData.parties} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <JudgeCard judges={caseData.judges} />
        </div>
      </div>

      {/* Redesigned Liquid-Style Navigation Bar for Document Actions */}
      {caseData.orders && caseData.orders.length > 0 && (
        <DocumentLiquidNavBar
          orders={caseData.orders}
          selectedFilename={selectedOrderFilename}
          onReadOrder={(fname) => handleOpenReader(fname, "pdf")}
          onOpenSummary={(fname) => handleOpenAI(fname || selectedOrderFilename || "")}
          onDownloadPDF={(fname) => handleDownloadPDF(fname)}
          aiLoading={aiLoading}
        />
      )}

      <div className="space-y-8">
        {/* AI Analysis Display */}
        <div id="ai-summary-section">
          {aiLoading ? (
            <SkeletonLoader count={1} height="150px" />
          ) : (
            selectedAI && (
              <AISummaryCard
                caseData={caseData}
                aiData={selectedAI}
                summary={selectedAI.executive_summary}
                plainLanguage={selectedAI.plain_language_summary}
                issues={selectedAI.primary_issues}
                reasoning={selectedAI.court_reasoning}
                ratioDecidendi={selectedAI.ratio_decidendi}
                directions={selectedAI.court_directions}
                statutesCited={selectedAI.statutes_cited}
                onReadDocument={handleOpenReader}
              />
            )
          )}
        </div>

        {/* Interactive Citation Network Graph Section */}
        <div id="citation-network-section">
          <CitationNetworkView
            cnr={caseData.cnr}
            caseTitle={caseData.case_title}
            onReadDocument={handleOpenPrecedentReader}
          />
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Case Timeline
          </h3>
          <Timeline events={caseData.timeline} />
        </div>
      </div>

      {/* In-Built Document Reader Modal */}
      {readerFilename && (
        <DocumentReaderModal
          isOpen={isReaderOpen}
          onClose={() => setIsReaderOpen(false)}
          cnr={readerCnr || caseData.cnr}
          filename={readerFilename}
          caseTitle={readerCaseTitle || caseData.case_title}
          courtName={readerCourtName || caseData.court?.court_name || "Court Record"}
          orderDate={readerOrderDate || caseData.decision_date || caseData.next_hearing_date || "Court Order"}
          initialMode={readerMode}
          orders={readerOrders}
          allowModeToggle={readerAllowToggle}
        />
      )}

      {/* Floating AI Chat (rendered into document.body at z-[1000] above the fullscreen PDF reader) */}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end pointer-events-auto">
          {isChatOpen && (
            <div 
              className="mb-4 w-[480px] h-[650px] max-h-[80vh] flex flex-col rounded-2xl overflow-hidden animate-slide-up shadow-2xl border overscroll-contain"
              style={{
                borderColor: "var(--border)",
                background: "var(--card)",
                overscrollBehavior: "contain",
              }}
            >
              <div className="p-3 px-4 border-b flex items-center justify-between" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--brass-soft)", color: "var(--brass-bright)" }}
                  >
                    <Sparkles size={15} />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                    Assistant
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button"
                    onClick={handleClearChat}
                    title="Clear conversation and start new chat"
                    className="px-2.5 py-1 rounded-lg hover:bg-[var(--surface-container)] text-xs flex items-center gap-1.5 transition-colors cursor-pointer border"
                    style={{ borderColor: "var(--border)", color: "var(--ink-dim)" }}
                  >
                    <RotateCcw size={12} />
                    <span className="text-[11px] font-medium">New Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExpandChat}
                    title="Expand to Full Chat Window"
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-container)] transition-colors cursor-pointer"
                    style={{ color: "var(--ink-dim)" }}
                  >
                    <Maximize2 size={15} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={chatLoading}
                  streamingMessage={streamingContent}
                  suggestedQuestions={suggestedQuestions}
                  onClearChat={handleClearChat}
                />
              </div>
            </div>
          )}
          
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer`}
            style={{ background: isChatOpen ? "var(--surface-container-high)" : "var(--primary)", color: isChatOpen ? "var(--text-primary)" : "var(--on-primary)" }}
          >
            {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
