import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Trash2, ArrowRight, Scale, Hash } from "lucide-react";
import { bookmarkService } from "@/services/bookmarks";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import type { Bookmark as BookmarkType } from "@/types/chat";
import { toast } from "sonner";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const data = await bookmarkService.list();
      setBookmarks(data);
    } catch {
      toast.error("Failed to load bookmarks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const handleRemove = async (cnr: string) => {
    try {
      await bookmarkService.remove(cnr);
      setBookmarks((prev) => prev.filter((b) => b.cnr !== cnr));
      toast.info("Bookmark removed.");
    } catch {
      toast.error("Failed to remove bookmark.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          Bookmarked Cases
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Manage your saved legal research, court orders, and judgments.
        </p>
      </div>

      {loading ? (
        <SkeletonLoader count={4} height="70px" />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          title="No bookmarked cases"
          description="Bookmark cases while searching to easily access their full judgments here."
          icon={<Bookmark size={32} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="card-float group p-5 flex flex-col justify-between gap-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "var(--surface-container)", color: "var(--primary)", border: "1px solid var(--border)" }}
                  >
                    <Scale size={17} />
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/case/${b.cnr}`}
                      className="text-sm font-semibold hover:underline line-clamp-2 block"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {b.title}
                    </Link>
                    <div
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] mt-1.5"
                      style={{ background: "var(--surface-container)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    >
                      <Hash size={11} />
                      <span>CNR: {b.cnr}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(b.cnr)}
                  className="btn-ghost p-1.5 rounded-lg text-muted hover:text-red-600 cursor-pointer flex-shrink-0"
                  title="Remove Bookmark"
                >
                  <Trash2 size={14} style={{ color: "var(--danger)" }} />
                </button>
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: "var(--border)" }}>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Saved {new Date(b.bookmarked_at).toLocaleDateString()}
                </span>
                <Link
                  to={`/case/${b.cnr}`}
                  className="btn-ghost flex items-center gap-1 text-xs font-semibold group-hover:translate-x-0.5 transition-transform"
                  style={{ padding: "4px 10px", color: "var(--primary)" }}
                >
                  Open Case <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
