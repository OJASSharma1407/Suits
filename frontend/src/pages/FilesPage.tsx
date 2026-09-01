import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Upload, FileText, Trash2, RefreshCw, Download, Search,
  AlertCircle, CheckCircle2, Clock, Loader2, X, FileImage,
  File, BookOpen, Scale, Gavel, ScrollText, FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { documentService } from "@/services/document";
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

// ─────────────────────────────────────────── Document Preview Modal ──
interface PreviewModalProps {
  doc: UserDocument;
  onClose: () => void;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
}
function PreviewModal({ doc, onClose, onDelete, onReprocess }: PreviewModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${doc.original_filename}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await documentService.delete(doc.id);
      toast.success("Document deleted.");
      onDelete(doc.id);
      onClose();
    } catch {
      toast.error("Failed to delete document.");
      setDeleting(false);
    }
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      await documentService.reprocess(doc.id);
      toast.success("Reprocessing started.");
      onReprocess(doc.id);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to start reprocessing.");
      setReprocessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl flex flex-col animate-spring-in"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          boxShadow: "var(--shadow-float)",
          maxHeight: "85vh",
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b" style={{ borderColor: "var(--hairline-soft)" }}>
          <div className="mt-0.5 flex-shrink-0" style={{ color: "var(--brass)" }}>
            {getMimeIcon(doc.mime_type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate" style={{ color: "var(--ink)" }}>{doc.original_filename}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StatusBadge status={doc.status} />
              <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                {formatBytes(doc.file_size)} · {doc.page_count > 0 ? `${doc.page_count} pages` : "—"} · {doc.chunk_count} chunks
              </span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ color: TAG_COLORS[doc.tag], background: `${TAG_COLORS[doc.tag]}18` }}
              >
                {TAG_ICONS[doc.tag]}
                {DOCUMENT_TAG_LABELS[doc.tag]}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-raised)] cursor-pointer flex-shrink-0" style={{ color: "var(--ink-faint)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Summary */}
        {doc.summary && (
          <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--hairline-soft)" }}>
            <p className="text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>{doc.summary}</p>
          </div>
        )}

        {/* Extracted Text */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {doc.status === "indexed" && doc.extracted_text ? (
            <pre
              className="text-[12.5px] leading-relaxed whitespace-pre-wrap font-mono"
              style={{ color: "var(--ink-dim)" }}
            >
              {doc.extracted_text.slice(0, 8000)}
              {doc.extracted_text.length > 8000 && "\n\n[… content truncated for preview]"}
            </pre>
          ) : doc.status === "failed" ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <AlertCircle size={28} style={{ color: "var(--danger)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>Processing Failed</p>
              {doc.error_message && (
                <p className="text-xs max-w-sm" style={{ color: "var(--ink-faint)" }}>{doc.error_message}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--brass)" }} />
              <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
                {doc.status === "processing" ? "Extracting text & generating embeddings…" : "Waiting for processing…"}
              </p>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--hairline-soft)" }}>
          <a
            href={documentService.getDownloadUrl(doc.id)}
            download={doc.original_filename}
            className="btn btn-ghost flex items-center gap-2 text-sm"
            style={{ padding: "8px 14px" }}
          >
            <Download size={14} /> Download
          </a>

          {doc.status === "failed" && (
            <button
              onClick={handleReprocess}
              disabled={reprocessing}
              className="btn btn-ghost flex items-center gap-2 text-sm"
              style={{ padding: "8px 14px", color: "var(--brass)" }}
            >
              {reprocessing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Retry
            </button>
          )}

          <div className="flex-1" />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn flex items-center gap-2 text-sm cursor-pointer"
            style={{
              padding: "8px 14px",
              background: "rgba(239,68,68,0.08)",
              color: "var(--danger)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "var(--radius)",
            }}
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────── Main Page ──
export default function FilesPage() {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<UserDocument | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [filterTag, setFilterTag] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

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

  const handleDocumentDeleted = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDocumentReprocessed = () => {
    loadData();
  };

  return (
    <div className="dashboard-layout" style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 24px 60px" }}>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-7 gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--ink)", fontFamily: "var(--font-display)", margin: 0, lineHeight: 1.2 }}
          >
            Evidence & Documents
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--ink-faint)" }}>
            Upload private case files. SUITS indexes them for AI-assisted legal analysis.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn btn-primary flex items-center gap-2"
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
            { label: "Indexed (RAG Ready)", value: stats.indexed_documents },
            { label: "Storage Used", value: formatBytes(stats.total_storage_bytes) },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
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
            placeholder="Search by filename or summary…"
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
          <option value="indexed">Indexed</option>
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

      {/* Document Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--brass)" }} />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Upload size={36} style={{ color: "var(--ink-faint)", opacity: 0.5 }} />
          <p className="text-base font-medium" style={{ color: "var(--ink-dim)" }}>No documents yet</p>
          <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
            Upload case files to enable AI-powered evidence analysis.
          </p>
          <button onClick={() => setShowUpload(true)} className="btn btn-primary mt-2 flex items-center gap-2">
            <Upload size={14} /> Upload First Document
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className="w-full text-left rounded-xl px-4 py-3.5 flex items-center gap-4 transition-all duration-150 cursor-pointer group"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--hairline)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-raised)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${TAG_COLORS[doc.tag]}18`, color: TAG_COLORS[doc.tag] }}
              >
                {getMimeIcon(doc.mime_type)}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>
                    {doc.original_filename}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                    style={{ color: TAG_COLORS[doc.tag], background: `${TAG_COLORS[doc.tag]}18` }}
                  >
                    {TAG_ICONS[doc.tag]}
                    {DOCUMENT_TAG_LABELS[doc.tag]}
                  </span>
                  {doc.cnr && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ color: "var(--brass)", background: "var(--brass-soft)", fontFamily: "var(--font-mono)" }}>
                      {doc.cnr}
                    </span>
                  )}
                </div>
                {doc.summary && (
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--ink-faint)" }}>{doc.summary}</p>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-xs hidden sm:block" style={{ color: "var(--ink-faint)" }}>
                  {formatBytes(doc.file_size)}
                </span>
                <span className="text-xs hidden md:block" style={{ color: "var(--ink-faint)" }}>
                  {doc.chunk_count} chunks
                </span>
                <StatusBadge status={doc.status} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={handleDocumentUploaded} />
      )}
      {selectedDoc && (
        <PreviewModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onDelete={handleDocumentDeleted}
          onReprocess={handleDocumentReprocessed}
        />
      )}
    </div>
  );
}
