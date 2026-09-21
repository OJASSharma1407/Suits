import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  FileImage,
  File,
  BookOpen,
  Scale,
  Gavel,
  ScrollText,
  FileCheck,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { documentService } from "@/services/document";
import { DocumentReaderModal } from "@/components/case/DocumentReaderModal";
import { CounterPleadingModal } from "@/components/defense/CounterPleadingModal";
import type { UserDocument, DocumentTag, DocumentFilters, DocumentStats } from "@/types/document";
import { DOCUMENT_TAG_LABELS, DOCUMENT_STATUS_LABELS } from "@/types/document";

// ─────────────────────────────────────────────────────────────── Helpers ──
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function getMimeIcon(mime: string) {
  if (mime === "application/pdf") return <FileText size={20} />;
  if (mime.startsWith("image/")) return <FileImage size={20} />;
  if (mime.includes("word")) return <FileCheck size={20} />;
  return <File size={20} />;
}

const TAG_ICONS: Record<DocumentTag, React.ReactNode> = {
  evidence: <Scale size={13} />,
  pleading: <ScrollText size={13} />,
  affidavit: <BookOpen size={13} />,
  court_order: <Gavel size={13} />,
  notice: <AlertCircle size={13} />,
  agreement: <FileCheck size={13} />,
  other: <File size={13} />,
};

const TAG_COLORS: Record<DocumentTag, string> = {
  evidence: "#f59e0b",
  pleading: "#6366f1",
  affidavit: "#10b981",
  court_order: "#ef4444",
  notice: "#f97316",
  agreement: "#3b82f6",
  other: "#6b7280",
};

// ─────────────────────────────────────────── Status Badge ──
function StatusBadge({ status }: { status: UserDocument["status"] }) {
  const config = {
    pending: { icon: <Clock size={11} />, color: "#a3a3a3", bg: "rgba(163,163,163,0.12)" },
    processing: { icon: <Loader2 size={11} className="animate-spin" />, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    indexed: { icon: <CheckCircle2 size={11} />, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    failed: { icon: <AlertCircle size={11} />, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  }[status];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ color: config.color, background: config.bg }}
    >
      {config.icon}
      {DOCUMENT_STATUS_LABELS[status]}
    </span>
  );
}

// ─────────────────────────────────────────── Upload Modal ──
interface UploadModalProps {
  onClose: () => void;
  onSuccess: (doc: UserDocument) => void;
}
function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [cnr, setCnr] = useState("");
  const [tag, setTag] = useState<DocumentTag>("other");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const doc = await documentService.upload(file, { cnr: cnr || undefined, tag }, (pct) => setProgress(pct));
      toast.success(`"${file.name}" uploaded — processing started.`);
      onSuccess(doc);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 space-y-5 animate-spring-in"
        style={{ background: "var(--surface)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-float)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
            Upload Legal Document
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-raised)] cursor-pointer" style={{ color: "var(--ink-faint)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
          style={{
            borderColor: dragging ? "var(--brass)" : "var(--hairline)",
            background: dragging ? "var(--brass-soft)" : "var(--surface-raised)",
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.tiff"
            onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div style={{ color: "var(--brass)" }}>{getMimeIcon(file.type)}</div>
              <p className="font-medium text-sm" style={{ color: "var(--ink)" }}>{file.name}</p>
              <p className="text-xs" style={{ color: "var(--ink-faint)" }}>{formatBytes(file.size)}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={28} style={{ color: "var(--ink-faint)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--ink-dim)" }}>Drag & drop or click to browse</p>
              <p className="text-xs" style={{ color: "var(--ink-faint)" }}>PDF, DOCX, TXT, PNG, JPG, TIFF — max 25 MB</p>
            </div>
          )}
        </div>

        {/* CNR & Tag */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              Case CNR (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. DLHC010123442024"
              value={cnr}
              onChange={(e) => setCnr(e.target.value)}
              className="w-full p-2.5 text-sm border outline-none"
              style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)", color: "var(--ink)", borderRadius: "var(--radius)", fontFamily: "var(--font-sans)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              Document Type
            </label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value as DocumentTag)}
              className="w-full p-2.5 text-sm border outline-none cursor-pointer"
              style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)", color: "var(--ink)", borderRadius: "var(--radius)", fontFamily: "var(--font-sans)" }}
            >
              {(Object.entries(DOCUMENT_TAG_LABELS) as [DocumentTag, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs" style={{ color: "var(--ink-faint)" }}>
              <span>Uploading…</span><span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-hover)" }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--brass)" }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn btn-ghost flex-1" disabled={uploading}>Cancel</button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? "Uploading…" : "Upload Document"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────── Main Page ──
export default function FilesPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<UserDocument | null>(null);
  const [defenseDocId, setDefenseDocId] = useState<string | null>(null);
  const [readerInitialMode, setReaderInitialMode] = useState<"pdf" | "text" | "ai">("pdf");
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [filterTag, setFilterTag] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const handleOpenDefenseDraftInEditor = (newDraft: { title: string; content: string }) => {
    const STORAGE_KEY = "suits_legal_drafts_v1";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const existing = saved ? JSON.parse(saved) : [];
      const newId = `draft-${Date.now()}`;
      const draftItem = {
        id: newId,
        title: newDraft.title,
        content: newDraft.content,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([draftItem, ...existing]));
    } catch {
      // storage quota
    }
    navigate("/document");
  };

  const loadData = useCallback(async () => {
    try {
      const [docs, st] = await Promise.all([
        documentService.list(filters),
        documentService.stats(),
      ]);
      setDocuments(docs);
      setStats(st);
    } catch {
      toast.error("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling for processing documents
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "pending" || d.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [documents, loadData]);

  const applyFilters = () => {
    setFilters({
      search: searchInput || undefined,
      tag: filterTag ? (filterTag as DocumentTag) : undefined,
      status: filterStatus ? (filterStatus as any) : undefined,
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    setFilterTag("");
    setFilterStatus("");
    setFilters({});
  };

  const handleDocumentUploaded = (doc: UserDocument) => {
    setDocuments((prev) => [doc, ...prev]);
    setStats((prev) => prev ? { ...prev, total_documents: prev.total_documents + 1, total_storage_bytes: prev.total_storage_bytes + doc.file_size } : prev);
  };

  const handleOpenReader = (doc: UserDocument, mode: "pdf" | "text" | "ai" = "pdf") => {
    setSelectedDoc(doc);
    setReaderInitialMode(mode);
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await documentService.delete(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Document deleted.");
    } catch {
      toast.error("Failed to delete document.");
    }
  };

  return (
    <div className="dashboard-layout" style={{ maxWidth: "1150px", margin: "0 auto", padding: "28px 24px 60px" }}>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-7 gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--ink)", fontFamily: "var(--font-display)", margin: 0, lineHeight: 1.2 }}
          >
            Evidence & Document Vault
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--ink-faint)" }}>
            Upload private legal documents. SUITS automatically performs OCR, structured legal analysis, and full-text research indexing.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn btn-primary flex items-center gap-2 shadow-sm"
          style={{ padding: "9px 20px" }}
        >
          <Upload size={15} />
          Upload Document
        </button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: "Total Documents", value: stats.total_documents },
            { label: "AI Analyzed & Ready", value: stats.indexed_documents },
            { label: "Vault Storage", value: formatBytes(stats.total_storage_bytes) },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4 card-float"
              style={{ background: "var(--surface)", border: "1px solid var(--hairline)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                {s.label}
              </p>
              <p className="text-2xl font-semibold" style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div
        className="flex items-center gap-3 mb-5 flex-wrap p-3 rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--hairline)" }}
      >
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
          <input
            type="text"
            placeholder="Search documents by name, summary, parties, or section…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full pl-9 pr-3 py-2 text-sm border outline-none"
            style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)", color: "var(--ink)", borderRadius: "var(--radius)" }}
          />
        </div>
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="px-3 py-2 text-sm border outline-none cursor-pointer"
          style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)", color: "var(--ink)", borderRadius: "var(--radius)" }}
        >
          <option value="">All Types</option>
          {(Object.entries(DOCUMENT_TAG_LABELS) as [DocumentTag, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border outline-none cursor-pointer"
          style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)", color: "var(--ink)", borderRadius: "var(--radius)" }}
        >
          <option value="">All Statuses</option>
          <option value="indexed">Ready / Analyzed</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <button onClick={applyFilters} className="btn btn-primary text-sm" style={{ padding: "8px 16px" }}>Filter</button>
        {(searchInput || filterTag || filterStatus) && (
          <button onClick={clearFilters} className="btn btn-ghost text-sm flex items-center gap-1" style={{ padding: "8px 12px" }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Document List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--brass)" }} />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Upload size={36} style={{ color: "var(--ink-faint)", opacity: 0.5 }} />
          <p className="text-base font-medium" style={{ color: "var(--ink-dim)" }}>No documents in vault</p>
          <p className="text-sm max-w-sm" style={{ color: "var(--ink-faint)" }}>
            Upload legal files to unlock OCR, interactive PDF highlighting, AI structured analysis, and in-document chat.
          </p>
          <button onClick={() => setShowUpload(true)} className="btn btn-primary mt-2 flex items-center gap-2">
            <Upload size={14} /> Upload First Document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleOpenReader(doc, "pdf")}
              className="w-full text-left rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-150 cursor-pointer group card-float"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--hairline)",
              }}
            >
              {/* Left Column: Icon & Title */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
                  style={{ background: `${TAG_COLORS[doc.tag]}18`, color: TAG_COLORS[doc.tag], border: "1px solid var(--hairline)" }}
                >
                  {getMimeIcon(doc.mime_type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
                      {doc.original_filename}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                      style={{ color: TAG_COLORS[doc.tag], background: `${TAG_COLORS[doc.tag]}18` }}
                    >
                      {TAG_ICONS[doc.tag]}
                      {DOCUMENT_TAG_LABELS[doc.tag]}
                    </span>
                    {doc.cnr && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded font-mono" style={{ color: "var(--brass)", background: "var(--brass-soft)" }}>
                        CNR: {doc.cnr}
                      </span>
                    )}
                    <StatusBadge status={doc.status} />
                  </div>

                  {doc.summary && (
                    <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                      {doc.summary}
                    </p>
                  )}

                  {/* Legal Quick Tags if Extracted */}
                  <div className="flex items-center gap-3 mt-2 text-[11px] flex-wrap" style={{ color: "var(--ink-faint)" }}>
                    <span>{formatBytes(doc.file_size)}</span>
                    {doc.page_count > 0 && <span>• {doc.page_count} pages</span>}
                    {doc.highlights && doc.highlights.length > 0 && (
                      <span className="text-amber-500 font-medium">• {doc.highlights.length} highlights</span>
                    )}
                    {doc.notes && <span className="text-emerald-500 font-medium">• Notes saved</span>}
                  </div>
                </div>
              </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDefenseDocId(doc.id);
                  }}
                  className="btn btn-ghost flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border hover:bg-indigo-500/10 cursor-pointer"
                  style={{ borderColor: "rgba(99, 102, 241, 0.3)", color: "#6366f1" }}
                  title="Draft Written Statement / Counter-Pleading under Order VIII CPC"
                >
                  <ShieldAlert size={13} />
                  <span>Draft Defense</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenReader(doc, "ai");
                  }}
                  className="btn btn-ghost flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border"
                  style={{ borderColor: "var(--hairline)", color: "var(--brass-bright)" }}
                  title="Open AI Legal Breakdown"
                >
                  <Sparkles size={13} />
                  <span>AI Insights</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenReader(doc, "pdf");
                  }}
                  className="btn btn-primary flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  title="Open in Document Reader"
                >
                  <span>Open</span>
                  <ArrowRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDelete(doc.id, e)}
                  className="p-2 rounded-lg hover:bg-[var(--surface-raised)] cursor-pointer text-muted opacity-60 hover:opacity-100 transition-opacity"
                  title="Delete Document"
                >
                  <Trash2 size={14} style={{ color: "var(--danger)" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={handleDocumentUploaded} />
      )}

      {selectedDoc && (
        <DocumentReaderModal
          isOpen={!!selectedDoc}
          onClose={() => {
            setSelectedDoc(null);
            loadData();
          }}
          userDoc={selectedDoc}
          userDocumentId={selectedDoc.id}
          initialMode={readerInitialMode}
        />
      )}

      {/* Counter-Pleading / Written Statement Modal */}
      {defenseDocId && (
        <CounterPleadingModal
          isOpen={!!defenseDocId}
          preselectedDocId={defenseDocId}
          onClose={() => setDefenseDocId(null)}
          onOpenInEditor={handleOpenDefenseDraftInEditor}
        />
      )}
    </div>
  );
}
