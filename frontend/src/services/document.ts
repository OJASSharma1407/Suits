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
import type { OrderAI } from "@/types/case";

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

  /** Get structured legal AI analysis for an uploaded document. */
  getAiAnalysis: async (documentId: string): Promise<OrderAI> => {
    const res = await api.get<APIResponse<OrderAI>>(`/documents/${documentId}/ai`);
    return res.data.data!;
  },

  /** Fetch array buffer for the uploaded PDF. */
  getArrayBuffer: async (documentId: string): Promise<ArrayBuffer> => {
    const res = await api.get(`/documents/${documentId}/arraybuffer`, {
      responseType: "arraybuffer",
    });
    return res.data as ArrayBuffer;
  },

  /** Save research notes, highlights, and tags for an uploaded document. */
  saveResearch: async (
    documentId: string,
    data: { notes?: string; highlights?: any[]; tags_list?: string[] }
  ): Promise<UserDocument> => {
    const res = await api.put<APIResponse<UserDocument>>(
      `/documents/${documentId}/research`,
      data
    );
    return res.data.data!;
  },

  /** Stream AI chat about this document using SSE. */
  streamChat: async (
    documentId: string,
    message: string,
    history: { role: string; message: string }[] = [],
    onChunk: (chunk: string) => void,
    onComplete: (full: string) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${baseUrl}/documents/${documentId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, history }),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error("Failed to stream AI response");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                fullText += data.token;
                onChunk(data.token);
              }
              if (data.done) {
                onComplete(fullText);
                return;
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }
      onComplete(fullText);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        throw err;
      }
    }
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
