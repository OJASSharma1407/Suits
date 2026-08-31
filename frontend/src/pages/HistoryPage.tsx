import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  MessageSquare,
  Trash2,
  ArrowRight,
  Clock,
  Calendar,
  Database,
  X,
} from "lucide-react";
import { historyService, type CaseHistoryItem, type ConversationHistoryItem } from "@/services/history";
import { chatService } from "@/services/chat";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";

/* ── Temporal Grouping Helpers ─────────────────────────────── */
interface GroupedItems<T> {
  label: string;
  icon: React.ReactNode;
  items: T[];
}

function getDateBucket(dateStr: string): "today" | "yesterday" | "week" | "earlier" {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86_400_000);

  if (d >= startOfToday) return "today";
  if (d >= startOfYesterday) return "yesterday";
  if (d >= startOfWeek) return "week";
  return "earlier";
}

const BUCKET_META: Record<string, { label: string; icon: React.ReactNode }> = {
  today:     { label: "Today",              icon: <Clock size={13} /> },
  yesterday: { label: "Yesterday",          icon: <Clock size={13} /> },
  week:      { label: "Previous 7 Days",    icon: <Calendar size={13} /> },
  earlier:   { label: "Earlier",            icon: <Calendar size={13} /> },
};

function groupByDate<T extends { viewed_at?: string; updated_at?: string; created_at?: string }>(
  items: T[],
  dateKey: "viewed_at" | "updated_at" | "created_at" = "viewed_at"
): GroupedItems<T>[] {
  const buckets: Record<string, T[]> = { today: [], yesterday: [], week: [], earlier: [] };
  items.forEach((item) => {
    const d = (item as any)[dateKey];
    if (!d) { buckets.earlier.push(item); return; }
    buckets[getDateBucket(d)].push(item);
  });

  const order: (keyof typeof BUCKET_META)[] = ["today", "yesterday", "week", "earlier"];
  return order
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({
      label: BUCKET_META[key].label,
      icon: BUCKET_META[key].icon,
      items: buckets[key],
    }));
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ── Main Component ────────────────────────────────────────── */
export default function HistoryPage() {
  const [cases, setCases] = useState<CaseHistoryItem[]>([]);
  const [conversations, setConversations] = useState<ConversationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const [caseData, convoData] = await Promise.all([
        historyService.getCases().catch(() => []),
        historyService.getConversations().catch(() => []),
      ]);
      setCases(caseData);
      setConversations(convoData);
    } catch {
      // Safe fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearCases = async () => {
    try {
      await historyService.clearCaseHistory();
      setCases([]);
      toast.info("Opened cases history cleared.");
    } catch {
      toast.error("Failed to clear case history.");
    }
  };

  const handleClearConversations = async () => {
    try {
      await Promise.allSettled(conversations.map((c) => chatService.deleteConversation(c.id)));
      setConversations([]);
      toast.info("AI conversations history cleared.");
    } catch {
      toast.error("Failed to clear AI conversations.");
    }
  };

  const handleDeleteCase = async (e: React.MouseEvent, cnr: string) => {
    e.stopPropagation();
    try {
      await historyService.deleteCaseView(cnr);
      setCases((prev) => prev.filter((c) => c.cnr !== cnr));
      toast.info("Case removed from history.");
    } catch {
      toast.error("Failed to remove case.");
    }
  };

  const groupedCases = useMemo(() => groupByDate(cases, "viewed_at"), [cases]);
  const groupedConversations = useMemo(() => groupByDate(conversations, "updated_at"), [conversations]);

  const BucketHeader = ({ group }: { group: GroupedItems<any> }) => (
    <div className="flex items-center gap-2 mb-2.5">
      <span style={{ color: "var(--text-muted)" }}>{group.icon}</span>
      <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        {group.label}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      <span
        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
        style={{ background: "var(--surface-container)", color: "var(--text-muted)" }}
      >
        {group.items.length}
      </span>
    </div>
  );

  return (
    <div className="dashboard-layout" style={{ maxWidth: "100%", width: "100%" }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12" style={{ marginTop: 44 }}>

        {/* ── Recently Opened Cases Column ──────────────────────── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-base font-medium flex items-center gap-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              <FileText size={17} style={{ color: "var(--brass)" }} /> Recently Opened Cases
            </h3>
            {cases.length > 0 && (
              <button
                onClick={handleClearCases}
                className="text-xs font-medium hover:underline flex items-center gap-1 cursor-pointer"
                style={{ color: "var(--danger)" }}
              >
                <Trash2 size={13} /> Clear All
              </button>
            )}
          </div>

          {loading ? (
            <SkeletonLoader count={3} height="56px" />
          ) : cases.length === 0 ? (
            <EmptyState
              title="No opened cases yet"
              description="Cases and judgments you view will be saved here for instant local retrieval."
            />
          ) : (
            <div className="space-y-6">
              {groupedCases.map((group) => (
                <div key={group.label}>
                  <BucketHeader group={group} />
                  <div className="space-y-2">
                    {group.items.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => navigate(`/case/${c.cnr}`)}
                        className="card-float group flex items-center justify-between gap-3 cursor-pointer hover:-translate-y-0.5 transition-all"
                        style={{ padding: "14px 18px", borderRadius: "var(--radius-md)" }}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background: "var(--brass-soft)",
                              color: "var(--brass-bright)",
                            }}
                          >
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span
                              className="text-sm font-medium block truncate group-hover:text-primary transition-colors"
                              style={{ color: "var(--text-primary)" }}
                              title={c.title}
                            >
                              {c.title}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-[10.5px] font-mono px-1.5 py-0.5 rounded"
                                style={{
                                  background: "var(--surface-container)",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {c.cnr}
                              </span>
                              <span
                                className="text-[10.5px] font-medium flex items-center gap-1 px-1.5 py-0.5 rounded"
                                style={{
                                  background: "rgba(16, 185, 129, 0.12)",
                                  color: "var(--seal-disposed)",
                                }}
                                title="Saved locally — opens without external API calls"
                              >
                                <Database size={10} /> Local
                              </span>
                              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                                {relativeTime(c.viewed_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => handleDeleteCase(e, c.cnr)}
                            className="p-1.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-pointer"
                            style={{ color: "var(--text-muted)" }}
                            title="Remove from history"
                          >
                            <X size={15} />
                          </button>
                          <span
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{
                              background: "var(--brass)",
                              color: "var(--on-primary)",
                            }}
                          >
                            Open Case <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent Conversations Column ──────────────────────── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-base font-medium flex items-center gap-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              <MessageSquare size={17} style={{ color: "var(--brass)" }} /> AI Conversations
            </h3>
            {conversations.length > 0 && (
              <button
                onClick={handleClearConversations}
                className="text-xs font-medium hover:underline flex items-center gap-1 cursor-pointer"
                style={{ color: "var(--danger)" }}
              >
                <Trash2 size={13} /> Clear All
              </button>
            )}
          </div>

          {loading ? (
            <SkeletonLoader count={3} height="56px" />
          ) : conversations.length === 0 ? (
            <EmptyState
              title="No recent chats"
              description="AI research conversations and chat sessions will appear here."
            />
          ) : (
            <div className="space-y-6">
              {groupedConversations.map((group) => (
                <div key={group.label}>
                  <BucketHeader group={group} />
                  <div className="space-y-2">
                    {group.items.map((c) => {
                      const displayTitle = c.title ? c.title.replace(/^Chat\s*-\s*/i, "Case - ") : `Case - ${c.cnr}`;
                      return (
                        <div
                          key={c.id}
                          onClick={() => navigate(`/chat/${c.id}`)}
                          className="card-float group flex items-center justify-between gap-3 cursor-pointer hover:-translate-y-0.5 transition-all"
                          style={{ padding: "14px 18px", borderRadius: "var(--radius-md)" }}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: "var(--brass-soft)", color: "var(--brass-bright)" }}
                            >
                              <MessageSquare size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className="text-sm font-medium block truncate"
                                style={{ color: "var(--text-primary)" }}
                                title={displayTitle}
                              >
                                {displayTitle}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className="text-[10.5px] font-mono px-1.5 py-0.5 rounded"
                                  style={{ background: "var(--surface-container)", color: "var(--text-secondary)" }}
                                >
                                  {c.cnr}
                                </span>
                                <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                                  {relativeTime(c.updated_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: "var(--brass)", color: "var(--on-primary)" }}
                          >
                            Open Chat <ArrowRight size={12} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
