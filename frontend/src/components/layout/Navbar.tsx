import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Menu, Sun, Moon } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useSidebarStore } from "@/store/sidebar-store";
import { useThemeStore } from "@/store/theme-store";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { toggle: toggleSidebar } = useSidebarStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isDark = theme === "dark";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 glass"
      style={{
        height: "var(--header-height)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-[var(--surface-container)] cursor-pointer"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <Link
          to="/dashboard"
          className="font-semibold text-lg tracking-tight flex items-center gap-2.5"
          style={{ color: "var(--text-primary)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--primary)", color: "var(--on-primary)" }}
          >
            S
          </div>
          SUITS
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark / Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full cursor-pointer relative overflow-hidden"
          style={{
            color: "var(--text-secondary)",
            background: "var(--surface-container)",
            border: "1px solid var(--border)",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? (
            <Sun size={16} key="sun" className="animate-icon-swap" />
          ) : (
            <Moon size={16} key="moon" className="animate-icon-swap" />
          )}
        </button>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 p-2 rounded-full hover:bg-[var(--surface-container)] cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Profile menu"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{
                background: "var(--surface-container)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
              }}
            >
              {user?.full_name?.charAt(0) || "U"}
            </div>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl p-1.5 z-50 animate-spring-in"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-float)",
                }}
              >
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {user?.full_name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {user?.email}
                  </p>
                </div>
                <hr style={{ borderColor: "var(--border)", margin: "4px 0" }} />
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-[var(--surface-container)]"
                  style={{ color: "var(--text-primary)" }}
                  onClick={() => setShowMenu(false)}
                >
                  <User size={15} /> Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-[var(--surface-container)] cursor-pointer"
                  style={{ color: "var(--danger)" }}
                >
                  <LogOut size={15} /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
