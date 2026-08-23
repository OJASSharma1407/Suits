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
    <div className="dashboard-layout" style={{ maxWidth: "100%", width: "100%", marginTop: 36 }}>
      {/* Centered Heading with generous top gap */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-medium"
          style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
        >
          Bookmarked Cases
        </h1>
      </div>

      {loading ? (
        <SkeletonLoader count={4} height="76px" />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          title="No bookmarked cases"
          description="Bookmark cases while searching to easily access their full judgments here."
          icon={<Bookmark size={32} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="card-float group p-6 flex flex-col justify-between gap-5 transition-all"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: "var(--brass-soft)",
                      color: "var(--brass-bright)",
                      border: "1px solid var(--hairline)",
                    }}
                  >
                    <Scale size={18} />
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/case/${b.cnr}`}
                      className="text-base font-medium hover:underline line-clamp-2 block"
                      style={{ color: "var(--ink)" }}
                    >
                      {b.title}
                    </Link>
                    <div
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] mt-2"
                      style={{
                        background: "var(--surface-container)",
                        color: "var(--ink-faint)",
                        border: "1px solid var(--hairline)",
                      }}
                    >
                      <Hash size={11} />
                      <span>CNR: {b.cnr}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(b.cnr)}
                  className="p-1.5 rounded text-muted hover:opacity-100 opacity-60 cursor-pointer flex-shrink-0 transition-opacity"
                  title="Remove Bookmark"
                  aria-label="Remove Bookmark"
                >
                  <Trash2 size={15} style={{ color: "var(--danger)" }} />
                </button>
              </div>

              <div
                className="pt-3.5 border-t flex items-center justify-between text-xs"
                style={{ borderColor: "var(--hairline-soft)" }}
              >
                <span className="text-[12px]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                  Saved {new Date(b.bookmarked_at).toLocaleDateString()}
                </span>
                <Link
                  to={`/case/${b.cnr}`}
                  className="btn btn-ghost flex items-center gap-1.5 text-xs font-semibold group-hover:translate-x-0.5 transition-transform"
                  style={{ padding: "5px 12px", color: "var(--brass)" }}
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
