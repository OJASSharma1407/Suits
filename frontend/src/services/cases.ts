import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type { CaseDetails, OrderMarkdown, OrderAI } from "@/types/case";

export const caseService = {
  getDetails: async (cnr: string) => {
    const res = await api.get<APIResponse<CaseDetails>>(`/cases/${cnr}`);
    return res.data.data;
  },

  refreshCase: async (cnr: string) => {
    const res = await api.post<APIResponse<unknown>>(`/cases/${cnr}/refresh`);
    return res.data;
  },

  getOrderMarkdown: async (cnr: string, filename: string) => {
    const res = await api.get<APIResponse<OrderMarkdown>>(`/orders/${cnr}/markdown/${filename}`);
    return res.data.data;
  },

  getOrderAI: async (cnr: string, filename: string) => {
    const res = await api.get<APIResponse<OrderAI>>(`/orders/${cnr}/ai/${filename}`);
    return res.data.data;
  },

  downloadOrderPDF: async (cnr: string, filename: string) => {
    const res = await api.get(`/orders/${cnr}/download/${filename}`, {
      responseType: "blob",
    });
    
    let extractedFilename = `${cnr}_${filename}`;
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
    const res = await api.get(`/orders/${cnr}/download/${filename}`, {
      responseType: "arraybuffer",
    });
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
