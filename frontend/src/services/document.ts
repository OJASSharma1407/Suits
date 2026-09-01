/** API service for user document management. */

import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type {
  UserDocument,
  DocumentStats,
  SemanticSearchResult,
  DocumentFilters,
  DocumentTag,
} from "@/types/document";

export const documentService = {
  /** Upload a document with optional CNR and tag. Returns progress callback. */
  upload: async (
    file: File,
    options: { cnr?: string; tag?: DocumentTag } = {},
    onProgress?: (pct: number) => void
  ): Promise<UserDocument> => {
    const formData = new FormData();
    formData.append("file", file);
    if (options.cnr) formData.append("cnr", options.cnr);
    if (options.tag) formData.append("tag", options.tag);

    const res = await api.post<APIResponse<UserDocument>>("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
    return res.data.data!;
  },

  /** List documents with optional filters. */
  list: async (filters: DocumentFilters = {}): Promise<UserDocument[]> => {
    const params: Record<string, string> = {};
    if (filters.cnr) params.cnr = filters.cnr;
    if (filters.tag) params.tag = filters.tag;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    const res = await api.get<APIResponse<UserDocument[]>>("/documents", { params });
    return res.data.data ?? [];
  },

  /** Get stats for the current user's document library. */
  stats: async (): Promise<DocumentStats> => {
    const res = await api.get<APIResponse<DocumentStats>>("/documents/stats");
    return res.data.data!;
  },

  /** Get full document details including extracted text. */
  getById: async (documentId: string): Promise<UserDocument> => {
    const res = await api.get<APIResponse<UserDocument>>(`/documents/${documentId}`);
    return res.data.data!;
  },

  /** Get a download URL for the original file. */
  getDownloadUrl: (documentId: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    return `${baseUrl}/documents/${documentId}/download`;
  },

  /** Delete a document and all its chunks. */
  delete: async (documentId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}`);
  },

  /** Retry processing a failed document. */
  reprocess: async (documentId: string): Promise<UserDocument> => {
    const res = await api.post<APIResponse<UserDocument>>(
      `/documents/${documentId}/reprocess`
    );
    return res.data.data!;
  },

  /** Perform semantic search across indexed documents. */
  semanticSearch: async (
    query: string,
    cnr?: string,
    topK = 5
  ): Promise<SemanticSearchResult[]> => {
    const res = await api.post<APIResponse<SemanticSearchResult[]>>("/documents/search", {
      query,
      cnr,
      top_k: topK,
    });
    return res.data.data ?? [];
  },
};
