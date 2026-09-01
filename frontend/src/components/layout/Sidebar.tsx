import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";

// SVG icons matching the reference design (stroke-based, 18×18)
function WorkspaceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  );
}
function FilesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <path d="M12 11v6M9 14h6" strokeWidth="1.5" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 19h16M7 15v4M12 9v10M17 5v14" />
    </svg>
  );
}
function ScalesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3v18M5 7l-3 6a3.5 3.5 0 007 0l-3-6zM19 7l-3 6a3.5 3.5 0 007 0l-3-6zM5 7h14M8 21h8" />
    </svg>
  );
}

const navItems = [
  { path: "/dashboard",  label: "Workspace",  Icon: WorkspaceIcon },
  { path: "/bookmarks",  label: "Bookmarks",  Icon: BookmarkIcon },
  { path: "/files",      label: "Files",      Icon: FilesIcon },
  { path: "/analytics",  label: "Analytics",  Icon: AnalyticsIcon },
  { path: "/history",    label: "History",    Icon: HistoryIcon },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const isDark = theme === "dark";

  return (
    <aside className="sidebar">
      {/* Logo + Nav grouped at top */}
      <div className="sidebar-top">
        <div className="wordmark">
          <ScalesIcon />
          <span className="mark">Suits</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map(({ path, label, Icon }) => {
            const isActive =
              location.pathname === path ||
              (path !== "/dashboard" && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={`nav-item${isActive ? " active" : ""}`}
                title={label}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="nav-item-active-pill"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 28,
                      mass: 0.7,
                    }}
                  />
                )}
                <span className="nav-item-inner">
                  <Icon />
                  <span className="nav-label">{label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer: Profile pill → /profile + Theme toggle */}
      <div className="sidebar-foot">
        <div className="sidebar-foot-row">
          {/* Clicking anywhere on the pill goes to /profile */}
          <button
            onClick={() => navigate("/profile")}
            className="sidebar-profile-btn"
            aria-label="Go to profile"
            title={user?.full_name || "Profile"}
          >
            <div className="sidebar-avatar">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.full_name || "User"}</span>
              <span className="sidebar-user-role">Advocate</span>
            </div>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="sidebar-theme-btn"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? (
              <Sun size={17} key="sun" className="animate-icon-swap" />
            ) : (
              <Moon size={17} key="moon" className="animate-icon-swap" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
