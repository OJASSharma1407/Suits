import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MessageSquare, Trash2 } from "lucide-react";
import api from "@/lib/axios";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";

export default function HistoryPage() {
  const [searches, setSearches] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          Research History
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          View and resume your recent searches and AI conversations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Searches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Search size={16} style={{ color: "var(--text-secondary)" }} /> Recent Searches
            </h3>
            {searches.length > 0 && (
              <button
                onClick={handleClearSearches}
                className="text-xs font-medium hover:underline flex items-center gap-1 cursor-pointer"
                style={{ color: "var(--danger)" }}
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>

          {loading ? (
            <SkeletonLoader count={3} height="50px" />
          ) : searches.length === 0 ? (
            <EmptyState title="No recent searches" description="Your search queries will appear here." />
          ) : (
            <div className="space-y-2">
              {searches.map((s) => (
                <Link
                  key={s.id}
                  to={`/search?query=${encodeURIComponent(s.query)}`}
                  className="card-float p-4 flex items-center justify-between text-sm"
                >
                  <span className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {s.query}
                  </span>
                  <span className="font-mono text-[11px] flex-shrink-0 ml-3" style={{ color: "var(--text-muted)" }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <MessageSquare size={16} style={{ color: "var(--text-secondary)" }} /> Recent Conversations
          </h3>

          {loading ? (
            <SkeletonLoader count={3} height="50px" />
          ) : conversations.length === 0 ? (
            <EmptyState title="No recent chats" description="Your AI conversations will appear here." />
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <Link
                  key={c.id}
                  to={`/chat/${c.id}`}
                  className="card-float p-4 flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-medium block" style={{ color: "var(--text-primary)" }}>
                      {c.title}
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                      CNR: {c.cnr}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] flex-shrink-0 ml-3" style={{ color: "var(--text-muted)" }}>
                    {new Date(c.updated_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
