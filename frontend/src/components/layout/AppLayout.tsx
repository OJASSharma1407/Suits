import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import { TopSearchBar } from "./TopSearchBar";
import { CommandPalette } from "@/components/common/CommandPalette";
import { useThemeStore } from "@/store/theme-store";
import { Toaster } from "sonner";

export default function AppLayout() {
  const { theme } = useThemeStore();
  const location = useLocation();
  const hideTopSearchBar =
    location.pathname === "/search" ||
    location.pathname.startsWith("/search") ||
    location.pathname === "/profile" ||
    location.pathname.startsWith("/profile");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="app-shell">
      {/* Left sidebar with navigation, user profile, and dark mode toggle */}
      <Sidebar />

      {/* Main column: top search bar (when not on search or profile) + page content */}
      <div className="main-column">
        {!hideTopSearchBar && <TopSearchBar />}
        <main className="main-content">
          <div className="main-inner">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette />

      <Toaster
        position="top-right"
        theme={theme}
        toastOptions={{
          style: {
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-sans)",
            boxShadow: "var(--shadow-float)",
          },
        }}
      />
    </div>
  );
}
