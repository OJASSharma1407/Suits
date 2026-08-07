import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { CommandPalette } from "@/components/common/CommandPalette";
import { useSidebarStore } from "@/store/sidebar-store";
import { Toaster } from "sonner";

export default function AppLayout() {
  const isOpen = useSidebarStore((s) => s.isOpen);

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg)" }}>
      {/* Decorative gradient orbs */}
      <div className="orb orb-1" style={{ top: "-120px", right: "-100px", opacity: 0.5 }} />
      <div className="orb orb-2" style={{ top: "300px", left: "-80px", opacity: 0.4 }} />

      <Navbar />
      <Sidebar />
      <main
        className="transition-all duration-200 relative z-10"
        style={{
          marginLeft: isOpen ? "240px" : "68px",
          paddingTop: "calc(var(--header-height) + 32px)",
          paddingBottom: "48px",
          paddingLeft: "40px",
          paddingRight: "40px",
        }}
      >
        <Outlet />
      </main>

      <CommandPalette />

      <Toaster
        position="bottom-right"
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
