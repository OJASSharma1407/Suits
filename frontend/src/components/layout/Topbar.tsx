import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, User, LogOut, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useState } from "react";

import { AIModeIndicator } from "@/components/common/AIModeIndicator";

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const isDark = theme === "dark";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="topbar">
      {/* Left empty spacer */}
      <div className="topbar-left" />

      {/* Right actions */}
      <div className="topbar-actions">
        {/* AI Engine Provider Indicator & Local Mode Switch */}
        <AIModeIndicator />

        {/* Refresh action */}
        <button
          onClick={handleRefresh}
          className="btn btn-ghost"
          style={{ padding: "8px 16px", fontSize: "13.5px", gap: "8px" }}
          title="Refresh current view"
        >
          <RotateCcw size={15} />
          <span>Refresh</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost"
          style={{ padding: "8px 14px" }}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? (
            <Sun size={17} key="sun" className="animate-icon-swap" />
          ) : (
            <Moon size={17} key="moon" className="animate-icon-swap" />
          )}
        </button>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="btn btn-ghost"
            style={{ padding: "6px 14px", gap: "10px" }}
            aria-label="Profile menu"
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--brass-soft)",
                border: "1px solid var(--brass)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--brass-bright)",
                flexShrink: 0,
              }}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "13.5px",
                fontWeight: 500,
                color: "var(--ink-dim)",
                maxWidth: 160,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.full_name || "User"}
            </span>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div
                className="absolute right-0 top-full mt-2 z-50 animate-spring-in"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-float)",
                  width: 240,
                  padding: "8px",
                }}
              >
                <div style={{ padding: "12px 14px 10px" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14.5px",
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    {user?.full_name}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--ink-faint)",
                      marginTop: "3px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user?.email}
                  </p>
                </div>
                <div
                  style={{
                    borderTop: "1px solid var(--hairline-soft)",
                    margin: "6px 0",
                  }}
                />
                <Link
                  to="/profile"
                  onClick={() => setShowMenu(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 14px",
                    borderRadius: "var(--radius)",
                    fontSize: "14px",
                    color: "var(--ink-dim)",
                    transition: "background 140ms ease",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--surface-raised)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <User size={15} /> Profile
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 14px",
                    borderRadius: "var(--radius)",
                    fontSize: "14px",
                    color: "var(--danger)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    transition: "background 140ms ease",
                    fontFamily: "var(--font-sans)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--surface-raised)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
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
