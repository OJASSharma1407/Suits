import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type {
  SavedFile,
  SavedFileListResponse,
  SaveFilePayload,
  UpdateFilePayload,
} from "@/types/file";

export const fileService = {
  list: async (params?: { q?: string; tag?: string; limit?: number; offset?: number }) => {
    const res = await api.get<APIResponse<SavedFileListResponse>>("/files", { params });
    return res.data.data;
  },

  get: async (fileId: string) => {
    const res = await api.get<APIResponse<SavedFile>>(`/files/${fileId}`);
    return res.data.data;
  },

  getByCase: async (cnr: string, filename: string) => {
    const cleanCnr = String(cnr || "").trim();
    const cleanFilename = String(filename || "").trim();
    const res = await api.get<APIResponse<SavedFile | null>>(
      `/files/case/${encodeURIComponent(cleanCnr)}/${encodeURIComponent(cleanFilename)}`
    );
    return res.data.data;
  },

  save: async (payload: SaveFilePayload) => {
    const res = await api.post<APIResponse<SavedFile>>("/files", payload);
    return res.data.data;
  },

  update: async (fileId: string, payload: UpdateFilePayload) => {
    const res = await api.patch<APIResponse<SavedFile>>(`/files/${fileId}`, payload);
    return res.data.data;
  },

  delete: async (fileId: string) => {
    await api.delete(`/files/${fileId}`);
  },

  deleteByCase: async (cnr: string, filename: string) => {
    const cleanCnr = String(cnr || "").trim();
    const cleanFilename = String(filename || "").trim();
    await api.delete(
      `/files/case/${encodeURIComponent(cleanCnr)}/${encodeURIComponent(cleanFilename)}`
    );
  },
};
