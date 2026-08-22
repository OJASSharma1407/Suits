import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { CaseHeader } from "@/components/case/CaseHeader";
import { Timeline } from "@/components/case/Timeline";
import { PartyCard } from "@/components/case/PartyCard";
import { JudgeCard } from "@/components/case/JudgeCard";
import { StatisticsCard } from "@/components/case/StatisticsCard";
import { DocumentLiquidNavBar } from "@/components/case/DocumentLiquidNavBar";
import { AISummaryCard } from "@/components/case/AISummaryCard";
import { DocumentReaderModal } from "@/components/case/DocumentReaderModal";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { ErrorState } from "@/components/common/ErrorState";

import { caseService } from "@/services/cases";
import { bookmarkService } from "@/services/bookmarks";
import { chatService } from "@/services/chat";
import { historyService } from "@/services/history";
import type { CaseDetails, OrderAI } from "@/types/case";
import type { ChatMessage } from "@/types/chat";
import { Sparkles, MessageSquare, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function CaseDashboardPage() {
  const { cnr } = useParams<{ cnr: string }>();

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
  const [readerFilename, setReaderFilename] = useState<string | null>(null);
  const [readerMode, setReaderMode] = useState<"pdf" | "text">("pdf");

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const streamAbortRef = React.useRef<AbortController | null>(null);

  const handleClearChat = () => {
    streamAbortRef.current?.abort();
    setMessages([]);
    setStreamingContent("");
    setConversationId(null);
    setSuggestedQuestions([]);
    toast.info("Started new research chat.");
  };

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
    setReaderFilename(targetFile);
    setReaderMode(initialMode);
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
          cnr={caseData.cnr}
          filename={readerFilename}
          caseTitle={caseData.case_title}
          courtName={caseData.court?.court_name || "Court Record"}
          orderDate={caseData.decision_date || caseData.next_hearing_date || "Court Order"}
          initialMode={readerMode}
          orders={caseData.orders}
        />
      )}

      {/* Floating AI Chat (rendered into document.body at z-[1000] above the fullscreen PDF reader) */}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end pointer-events-auto">
          {isChatOpen && (
            <div 
              className="mb-4 w-[480px] h-[650px] max-h-[80vh] flex flex-col rounded-2xl overflow-hidden animate-slide-up shadow-2xl"
              style={{ border: "1px solid var(--border-strong)", background: "var(--card)" }}
            >
              <div className="p-3.5 border-b flex items-center justify-between" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--surface-container)", color: "var(--primary)" }}
                  >
                    <Sparkles size={15} />
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    AI Research Assistant
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={handleClearChat}
                    title="Clear conversation and start new chat"
                    className="px-2.5 py-1 rounded-lg hover:bg-[var(--surface-container)] text-xs flex items-center gap-1.5 transition-colors cursor-pointer border"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    <RotateCcw size={12} />
                    <span className="text-[11px] font-medium">New Chat</span>
                  </button>
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    className="p-1 rounded-lg hover:bg-[var(--surface-container)] transition-colors cursor-pointer"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <X size={16} />
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
