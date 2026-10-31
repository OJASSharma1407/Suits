import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type { CaseDetails, OrderMarkdown, OrderAI } from "@/types/case";
import type { SimilarCasesResponse } from "@/types/similar-case";

/**
 * Sanitize a filename for use in API URL path segments.
 * Extracts the numeric TID from Kanoon URLs and encodes other special chars.
 */
function sanitizeFilename(filename: string): string {
  // Extract numeric TID from full Kanoon URLs like https://indiankanoon.org/doc/193792759/
  const kanoonMatch = filename.match(/indiankanoon\.org\/doc\/(\d+)/);
  if (kanoonMatch) {
    return kanoonMatch[1];
  }
  return filename;
}

export const caseService = {
  getDetails: async (cnr: string) => {
    const res = await api.get<APIResponse<CaseDetails>>(`/cases/${cnr}`);
    return res.data.data;
  },

  refreshCase: async (cnr: string) => {
    const res = await api.post<APIResponse<unknown>>(`/cases/${cnr}/refresh`);
    return res.data;
  },

  getSimilarCases: async (cnr: string) => {
    const res = await api.get<APIResponse<SimilarCasesResponse>>(`/cases/${cnr}/similar-cases`);
    return res.data.data;
  },

  getOrderMarkdown: async (cnr: string, filename: string) => {
    const safeFilename = sanitizeFilename(filename);
    const res = await api.get<APIResponse<OrderMarkdown>>(
      `/orders/${encodeURIComponent(cnr)}/markdown/${encodeURIComponent(safeFilename)}`
    );
    return res.data.data;
  },

  getOrderAI: async (cnr: string, filename: string) => {
    const safeFilename = sanitizeFilename(filename);
    const res = await api.get<APIResponse<OrderAI>>(
      `/orders/${encodeURIComponent(cnr)}/ai/${encodeURIComponent(safeFilename)}`
    );
    return res.data.data;
  },

  downloadOrderPDF: async (cnr: string, filename: string) => {
    const safeFilename = sanitizeFilename(filename);
    const res = await api.get(
      `/orders/${encodeURIComponent(cnr)}/download/${encodeURIComponent(safeFilename)}`,
      { responseType: "blob" }
    );
    
    let extractedFilename = `${cnr}_${safeFilename}`;
    const disposition = res.headers['content-disposition'];
    if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
            extractedFilename = filenameMatch[1];
        }
    }
    return { blob: res.data, filename: extractedFilename };
  },

  getOrderPDFArrayBuffer: async (cnr: string, filename: string) => {
    const safeFilename = sanitizeFilename(filename);
    const res = await api.get(
      `/orders/${encodeURIComponent(cnr)}/download/${encodeURIComponent(safeFilename)}`,
      { responseType: "arraybuffer" }
    );
    return res.data as ArrayBuffer;
  },

  getCourtStructure: async () => {
    const res = await api.get<APIResponse<unknown>>("/cases/reference/court-structure");
    return res.data.data;
  },

  getEnums: async () => {
    const res = await api.get<APIResponse<unknown>>("/cases/reference/enums");
    return res.data.data;
  },
};
