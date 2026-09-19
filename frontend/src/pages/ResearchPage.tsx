import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trash2,
  Printer,
  Scale,
  BookOpen,
  Highlighter,
  ArrowRight,
  ArrowLeftRight,
  Hash,
  FolderLock,
} from "lucide-react";
import { fileService } from "@/services/files";
import type { SavedFile } from "@/types/file";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { DocumentReaderModal } from "@/components/case/DocumentReaderModal";
import { ResearchBriefModal } from "@/components/files/ResearchBriefModal";
import { EraTransitionExplorer } from "@/components/research/EraTransitionExplorer";
import { toast } from "sonner";

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState<"era_transition" | "vault">("era_transition");
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [loading, setLoading] = useState(true);

  const [readerFile, setReaderFile] = useState<SavedFile | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  const [briefFile, setBriefFile] = useState<SavedFile | null>(null);
  const [isBriefOpen, setIsBriefOpen] = useState(false);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await fileService.list();
      if (data && Array.isArray(data.items)) {
        setFiles(data.items);
      } else {
        setFiles([]);
      }
    } catch {
      toast.error("Failed to load saved research.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDelete = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this dossier from your vault?")) return;
    try {
      await fileService.delete(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.info("Dossier removed.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const handleOpenReader = (file: SavedFile) => {
    setReaderFile(file);
    setIsReaderOpen(true);
  };

  const handleOpenBrief = (file: SavedFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setBriefFile(file);
    setIsBriefOpen(true);
  };

  return (
    <div className="dashboard-layout" style={{ maxWidth: "100%", width: "100%", marginTop: 36 }}>
      {/* Top Page Tabs */}
      <div className="flex items-center gap-3 border-b border-border/40 pb-3 mb-6">
        <button
          onClick={() => setActiveTab("era_transition")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "era_transition"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span>Criminal Law Era Transition Hub (IPC/CrPC ⇄ BNS/BNSS)</span>
        </button>

        <button
          onClick={() => setActiveTab("vault")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "vault"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <FolderLock className="h-4 w-4" />
          <span>Research Vault & Saved Dossiers ({files.length})</span>
        </button>
      </div>

      {activeTab === "era_transition" ? (
        <EraTransitionExplorer />
      ) : loading ? (
        <SkeletonLoader count={3} height="76px" />
      ) : files.length === 0 ? (
        <EmptyState
          title="No saved research"
          description="Open any court order in the reader and click 'Save to Research Vault' to start building your dossier."
          icon={<BookOpen size={32} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {files.map((file) => (
            <div
              key={file.id}
              className="card-float group p-6 flex flex-col justify-between gap-5 transition-all cursor-pointer"
              style={{ borderRadius: "var(--radius-md)" }}
              onClick={() => handleOpenReader(file)}
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
                    <span
                      className="text-base font-medium line-clamp-2 block"
                      style={{ color: "var(--ink)" }}
                    >
                      {file.case_title}
                    </span>
                    <div
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] mt-2"
                      style={{
                        background: "var(--surface-container)",
                        color: "var(--ink-faint)",
                        border: "1px solid var(--hairline)",
                      }}
                    >
                      <Hash size={11} />
                      <span>{file.cnr}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(file.id, e)}
                  className="p-1.5 rounded text-muted hover:opacity-100 opacity-60 cursor-pointer flex-shrink-0 transition-opacity"
                  title="Remove"
                  aria-label="Remove"
                >
                  <Trash2 size={15} style={{ color: "var(--danger)" }} />
                </button>
              </div>

              {/* Footer: metadata + actions */}
              <div
                className="pt-3.5 border-t flex items-center justify-between text-xs"
                style={{ borderColor: "var(--hairline-soft)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
                  >
                    {file.court_name}
                  </span>
                  {file.highlights && file.highlights.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1 text-[11px]"
                      style={{ color: "var(--brass)" }}
                    >
                      <Highlighter size={11} />
                      {file.highlights.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleOpenBrief(file, e)}
                    className="p-1.5 rounded hover:opacity-100 opacity-60 cursor-pointer transition-opacity"
                    title="Print Brief"
                    aria-label="Print Brief"
                  >
                    <Printer size={14} style={{ color: "var(--ink-faint)" }} />
                  </button>
                  <span
                    className="btn btn-ghost flex items-center gap-1.5 text-xs font-semibold group-hover:translate-x-0.5 transition-transform"
                    style={{ padding: "5px 12px", color: "var(--brass)" }}
                  >
                    Open <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Reader Modal */}
      {readerFile && (
        <DocumentReaderModal
          isOpen={isReaderOpen}
          onClose={() => {
            setIsReaderOpen(false);
            loadFiles();
          }}
          cnr={readerFile.cnr}
          filename={readerFile.filename}
          caseTitle={readerFile.case_title}
          courtName={readerFile.court_name}
          orderDate={readerFile.order_date}
          initialMode="pdf"
        />
      )}

      {/* Research Brief Modal */}
      {briefFile && (
        <ResearchBriefModal
          isOpen={isBriefOpen}
          onClose={() => setIsBriefOpen(false)}
          caseTitle={briefFile.case_title}
          courtName={briefFile.court_name}
          orderDate={briefFile.order_date}
          cnr={briefFile.cnr}
          notes={briefFile.notes}
          highlights={briefFile.highlights || []}
          tags={briefFile.tags || []}
        />
      )}
    </div>
  );
}
