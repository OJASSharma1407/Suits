/** TypeScript types for user-uploaded legal documents. */

export type DocumentStatus = "pending" | "processing" | "indexed" | "failed";

export type DocumentTag =
  | "evidence"
  | "pleading"
  | "affidavit"
  | "court_order"
  | "notice"
  | "agreement"
  | "other";

export const DOCUMENT_TAG_LABELS: Record<DocumentTag, string> = {
  evidence: "Evidence",
  pleading: "Pleading",
  affidavit: "Affidavit",
  court_order: "Court Order",
  notice: "Notice",
  agreement: "Agreement",
  other: "Other",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: "Pending",
  processing: "Processing…",
  indexed: "Indexed",
  failed: "Failed",
};

export interface UserDocument {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  tag: DocumentTag;
  cnr?: string | null;
  status: DocumentStatus;
  summary?: string | null;
  extracted_text?: string | null;
  chunk_count: number;
  page_count: number;
  created_at: string;
  updated_at: string;
  error_message?: string | null;
}

export interface DocumentStats {
  total_documents: number;
  indexed_documents: number;
  total_storage_bytes: number;
}

export interface SemanticSearchResult {
  score: number;
  chunk_text: string;
  document_id: string;
  original_filename: string;
  tag: DocumentTag;
  cnr?: string | null;
}

export interface DocumentFilters {
  cnr?: string;
  tag?: DocumentTag;
  status?: DocumentStatus;
  search?: string;
}
