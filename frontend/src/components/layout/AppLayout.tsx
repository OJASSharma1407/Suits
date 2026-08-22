import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { CommandPalette } from "@/components/common/CommandPalette";
import { useSidebarStore } from "@/store/sidebar-store";
import { useThemeStore } from "@/store/theme-store";
import { Toaster } from "sonner";

export default function AppLayout() {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const { theme } = useThemeStore();

  // Keep data-theme in sync with store on every mount/update
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const sidebarWidth = isOpen ? 240 : 68;

  return (
    <div
      className="min-h-screen relative overflow-x-hidden w-full max-w-full"
      style={{ background: "var(--bg)" }}
    >
      {/* Decorative gradient orbs - clamped inside container */}
      <div
        className="orb orb-1"
        style={{ top: "-120px", right: "-40px", opacity: 0.5 }}
      />
      <div
        className="orb orb-2"
        style={{ top: "300px", left: "-40px", opacity: 0.4 }}
      />

      <Navbar />
      <Sidebar />
      <main
        className="transition-all duration-200 relative z-10 box-border min-w-0"
        style={{
          paddingLeft: `calc(${sidebarWidth}px + clamp(16px, 2.5vw, 32px))`,
          paddingRight: `clamp(16px, 2.5vw, 32px)`,
          paddingTop: `calc(var(--header-height) + clamp(20px, 2.5vw, 32px))`,
          paddingBottom: "48px",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <div className="w-full max-w-6xl mx-auto min-w-0">
          <Outlet />
        </div>
      </main>

      <CommandPalette />

      <Toaster
        position="bottom-right"
        theme={theme}
        toastOptions={{
          style: {
            background: "var(--card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-float)",
          },
        }}
      />
    </div>
  );
}
