import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CaseHeader } from "@/components/case/CaseHeader";
import { Timeline } from "@/components/case/Timeline";
import { PartyCard } from "@/components/case/PartyCard";
import { JudgeCard } from "@/components/case/JudgeCard";
import { StatisticsCard } from "@/components/case/StatisticsCard";
import { OrderCard } from "@/components/case/OrderCard";
import { AISummaryCard } from "@/components/case/AISummaryCard";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { ErrorState } from "@/components/common/ErrorState";

import { caseService } from "@/services/cases";
import { bookmarkService } from "@/services/bookmarks";
import { chatService } from "@/services/chat";
import type { CaseDetails, OrderAI } from "@/types/case";
import type { ChatMessage } from "@/types/chat";
import { Sparkles, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";

export default function CaseDashboardPage() {
  const { cnr } = useParams<{ cnr: string }>();

  const [caseData, setCaseData] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedAI, setSelectedAI] = useState<OrderAI | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const streamAbortRef = React.useRef<AbortController | null>(null);

  const fetchCase = async () => {
    if (!cnr) return;
    setLoading(true);
    setError(null);
    try {
      const data = await caseService.getDetails(cnr);
      setCaseData(data);
      const bookmarked = await bookmarkService.check(cnr);
      setIsBookmarked(bookmarked);
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
        toast.success("Case bookmarked.");
      }
    } catch {
      toast.error("Failed to update bookmark.");
    }
  };

  const handleRefresh = async () => {
    if (!cnr) return;
    setIsRefreshing(true);
    try {
      await caseService.refreshCase(cnr);
      toast.success("Case data refreshed.");
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
      toast.success("AI analysis loaded.");
    } catch {
      toast.error("AI analysis unavailable for this order.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadPDF = async (filename: string) => {
    if (!cnr) return;
    try {
      const { blob, filename: safeFilename } = await caseService.downloadOrderPDF(cnr, filename);
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
        const convo = await chatService.createConversation(cnr, `Chat - ${cnr}`);
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

      // Start streaming — tokens arrive in real time
      const abort = chatService.streamMessage(
        convoId,
        msg,
        // onToken: append each new piece to the live buffer
        (token) => {
          setChatLoading(false); // hide typing dots once first token arrives
          setStreamingContent((prev) => prev + token);
        },
        // onDone: stream finished — commit final message & reload from server
        async (questions) => {
          setStreamingContent("");
          setSuggestedQuestions(questions);
          setChatLoading(false);
          try {
            const updated = await chatService.getMessages(convoId);
            setMessages(updated);
          } catch {
            // ignore refresh errors — the optimistic message is already shown
          }
        },
        // onError
        (err) => {
          setStreamingContent("");
          setChatLoading(false);
          toast.error(`AI error: ${err}`);
        },
        // Pass the currently selected order filename, or the first order if none selected
        selectedAI?.filename || caseData?.orders?.[0]?.filename
      );

      streamAbortRef.current = abort;
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PartyCard parties={caseData.parties} />

          {/* Orders Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Court Orders ({caseData.orders.length})
            </h3>
            {caseData.orders.length === 0 ? (
              <p className="text-sm card-float p-6" style={{ color: "var(--text-muted)" }}>
                No court orders listed.
              </p>
            ) : (
              <div className="space-y-3">
                {caseData.orders.map((o, i) => (
                  <OrderCard
                    key={i}
                    cnr={caseData.cnr}
                    order={o}
                    onOpenAI={handleOpenAI}
                    onDownloadPDF={handleDownloadPDF}
                  />
                ))}
              </div>
            )}
          </div>

          {/* AI Analysis Display */}
          {aiLoading ? (
            <SkeletonLoader count={1} height="150px" />
          ) : (
            selectedAI && (
              <AISummaryCard
                summary={selectedAI.executive_summary}
                plainLanguage={selectedAI.plain_language_summary}
                issues={selectedAI.primary_issues}
                reasoning={selectedAI.court_reasoning}
                ratioDecidendi={selectedAI.ratio_decidendi}
                directions={selectedAI.court_directions}
              />
            )
          )}

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Case Timeline
            </h3>
            <Timeline events={caseData.timeline} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <JudgeCard judges={caseData.judges} />
        </div>
      </div>

      {/* Floating AI Chat */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div 
            className="mb-4 w-[480px] h-[650px] max-h-[80vh] flex flex-col card-float overflow-hidden rounded-2xl"
            style={{ boxShadow: "var(--shadow-float)", border: "1px solid var(--border-strong)", background: "var(--bg)" }}
          >
            <div className="p-3 border-b flex items-center justify-between" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Sparkles size={16} style={{ color: "var(--primary)" }} /> AI Research Assistant
              </h3>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--surface-container)] transition-colors cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={chatLoading}
                streamingMessage={streamingContent}
                suggestedQuestions={suggestedQuestions}
              />
            </div>
          </div>
        )}
        
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer`}
          style={{ background: isChatOpen ? "var(--surface-container-high)" : "var(--primary)", color: isChatOpen ? "var(--text-primary)" : "var(--on-primary)" }}
        >
          {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </button>
      </div>
    </div>
  );
}
