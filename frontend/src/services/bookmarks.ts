import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type { Bookmark } from "@/types/chat";

export const bookmarkService = {
  list: async () => {
    const res = await api.get<APIResponse<Bookmark[]>>("/bookmarks");
    return res.data.data;
  },

  add: async (cnr: string, title?: string | null) => {
    const cleanCnr = String(cnr || "").trim();
    const cleanTitle = title && String(title).trim() ? String(title).trim() : "Untitled Case";
    const res = await api.post<APIResponse<Bookmark>>("/bookmarks", { cnr: cleanCnr, title: cleanTitle });
    return res.data.data;
  },

  remove: async (cnr: string) => {
    const cleanCnr = String(cnr || "").trim();
    await api.delete(`/bookmarks/${cleanCnr}`);
  },

  check: async (cnr: string) => {
    const cleanCnr = String(cnr || "").trim();
    const res = await api.get<APIResponse<boolean>>(`/bookmarks/${cleanCnr}/check`);
    return res.data.data;
  },
};
