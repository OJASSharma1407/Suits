import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Trash2, ExternalLink } from "lucide-react";
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
          Manage your saved legal research and favourite cases.
        </p>
      </div>

      {loading ? (
        <SkeletonLoader count={4} height="70px" />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          title="No bookmarked cases"
          description="Bookmark cases while searching to easily access them here."
          icon={<Bookmark size={32} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookmarks.map((b) => (
            <div key={b.id} className="card-float p-5 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {b.title}
                </h4>
                <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                  CNR: {b.cnr}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/case/${b.cnr}`}
                  className="btn-ghost"
                  style={{ padding: "8px", borderRadius: "var(--radius-lg)" }}
                  title="Open Case"
                >
                  <ExternalLink size={15} style={{ color: "var(--text-secondary)" }} />
                </Link>
                <button
                  onClick={() => handleRemove(b.cnr)}
                  className="btn-ghost cursor-pointer"
                  style={{ padding: "8px", borderRadius: "var(--radius-lg)" }}
                  title="Remove Bookmark"
                >
                  <Trash2 size={15} style={{ color: "var(--danger)" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
