import { create } from "zustand";
import { persist } from "zustand/middleware";

// Light theme only — Auralis design system
// Store kept for API compatibility; the theme is always "light"

interface ThemeState {
  theme: "light";
  setTheme: (theme: "light") => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (_theme) => {
        set({ theme: "light" });
      },
    }),
    { name: "suits-theme" }
  )
);
