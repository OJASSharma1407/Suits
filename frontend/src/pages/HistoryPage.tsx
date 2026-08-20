import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MessageSquare, Trash2, ArrowRight, Clock, Calendar } from "lucide-react";
import api from "@/lib/axios";
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

function groupByDate<T extends { created_at?: string; updated_at?: string }>(
  items: T[],
  dateKey: "created_at" | "updated_at" = "created_at"
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
  const [searches, setSearches] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const searchRes = await api.get("/history/searches");
      setSearches(searchRes.data.data);

      const convoRes = await api.get("/history/conversations");
      setConversations(convoRes.data.data);
    } catch {
      toast.error("Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearSearches = async () => {
    try {
      await api.delete("/history/searches");
      setSearches([]);
      toast.info("Search history cleared.");
    } catch {
      toast.error("Failed to clear history.");
    }
  };

  const groupedSearches = useMemo(() => groupByDate(searches, "created_at"), [searches]);
  const groupedConversations = useMemo(() => groupByDate(conversations, "updated_at"), [conversations]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Page Header ───────────────────────────────────────── */}
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
        >
          Research History
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          View and resume your recent searches and AI conversations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ── Recent Searches Column ───────────────────────────── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3
              className="text-sm font-semibold flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              <Search size={16} style={{ color: "var(--text-secondary)" }} /> Recent Searches
            </h3>
            {searches.length > 0 && (
              <button
                onClick={handleClearSearches}
                className="text-xs font-medium hover:underline flex items-center gap-1 cursor-pointer"
                style={{ color: "var(--danger)" }}
              >
                <Trash2 size={12} /> Clear All
              </button>
            )}
          </div>

          {loading ? (
            <SkeletonLoader count={3} height="50px" />
          ) : searches.length === 0 ? (
            <EmptyState title="No recent searches" description="Your search queries will appear here." />
          ) : (
            <div className="space-y-5">
              {groupedSearches.map((group) => (
                <div key={group.label}>
                  {/* Group Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: "var(--text-muted)" }}>{group.icon}</span>
                    <span
                      className="text-[11px] font-semibold uppercase tracking-widest"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {group.label}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--surface-container)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {group.items.length}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5">
                    {group.items.map((s: any) => (
                      <div
                        key={s.id}
                        className="card-float group flex items-center justify-between gap-3"
                        style={{ padding: "12px 16px", borderRadius: "var(--radius-lg)" }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "var(--surface-container)", color: "var(--text-muted)" }}
                          >
                            <Search size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span
                              className="text-sm font-medium block truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {s.query}
                            </span>
                            <span
                              className="text-[11px] font-medium"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {relativeTime(s.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* 1-click resume */}
                        <button
                          onClick={() => navigate(`/search?query=${encodeURIComponent(s.query)}`)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100"
                          style={{
                            background: "var(--primary)",
                            color: "var(--on-primary)",
                            border: "none",
                            transition: "opacity 200ms ease, transform 150ms ease",
                          }}
                          title="Resume this search"
                        >
                          Resume <ArrowRight size={12} />
                        </button>
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
          <h3
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <MessageSquare size={16} style={{ color: "var(--text-secondary)" }} /> Recent Conversations
          </h3>

          {loading ? (
            <SkeletonLoader count={3} height="50px" />
          ) : conversations.length === 0 ? (
            <EmptyState title="No recent chats" description="Your AI conversations will appear here." />
          ) : (
            <div className="space-y-5">
              {groupedConversations.map((group) => (
                <div key={group.label}>
                  {/* Group Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: "var(--text-muted)" }}>{group.icon}</span>
                    <span
                      className="text-[11px] font-semibold uppercase tracking-widest"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {group.label}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--surface-container)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {group.items.length}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5">
                    {group.items.map((c: any) => (
                      <div
                        key={c.id}
                        className="card-float group flex items-center justify-between gap-3"
                        style={{ padding: "12px 16px", borderRadius: "var(--radius-lg)" }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(30, 58, 95, 0.08)", color: "#1e3a5f" }}
                          >
                            <MessageSquare size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span
                              className="text-sm font-medium block truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {c.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                style={{
                                  background: "var(--surface-container)",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {c.cnr}
                              </span>
                              <span
                                className="text-[11px] font-medium"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {relativeTime(c.updated_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 1-click resume */}
                        <button
                          onClick={() => navigate(`/chat/${c.id}`)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100"
                          style={{
                            background: "#1e3a5f",
                            color: "#ffffff",
                            border: "none",
                            transition: "opacity 200ms ease, transform 150ms ease",
                          }}
                          title="Resume this conversation"
                        >
                          Resume <ArrowRight size={12} />
                        </button>
                      </div>
                    ))}
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
