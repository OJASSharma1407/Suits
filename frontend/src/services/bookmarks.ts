import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type { Bookmark } from "@/types/chat";

export const bookmarkService = {
  list: async () => {
    const res = await api.get<APIResponse<Bookmark[]>>("/bookmarks");
    return res.data.data;
  },

  add: async (cnr: string, title: string) => {
    const res = await api.post<APIResponse<Bookmark>>("/bookmarks", { cnr, title });
    return res.data.data;
  },

  remove: async (cnr: string) => {
    await api.delete(`/bookmarks/${cnr}`);
  },

  check: async (cnr: string) => {
    const res = await api.get<APIResponse<boolean>>(`/bookmarks/${cnr}/check`);
    return res.data.data;
  },
};
