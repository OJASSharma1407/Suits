import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon, User, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useState } from "react";

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
  { path: "/history",    label: "History",    Icon: HistoryIcon },
  { path: "/analytics",  label: "Analytics",  Icon: AnalyticsIcon },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [showMenu, setShowMenu] = useState(false);

  const isDark = theme === "dark";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {/* Wordmark */}
      <div className="wordmark">
        <ScalesIcon />
        <span className="mark">Suits</span>
      </div>

      {/* Nav (Search removed from sidebar as it is now at top center of page) */}
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
              <Icon />
              <span className="nav-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: Profile & Dark Mode Toggle (Bottom Left) */}
      <div className="sidebar-foot">
        <div className="sidebar-foot-row">
          {/* Profile Menu Button */}
          <div className="relative flex-1 min-w-0">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="sidebar-profile-btn"
              aria-label="User Profile"
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

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="sidebar-profile-dropdown animate-spring-in">
                  <div style={{ padding: "10px 14px 8px" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
                      {user?.full_name}
                    </p>
                    <p style={{ margin: 0, fontSize: "11.5px", fontFamily: "var(--font-mono)", color: "var(--ink-faint)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user?.email}
                    </p>
                  </div>
                  <div style={{ borderTop: "1px solid var(--hairline-soft)", margin: "4px 0" }} />
                  <Link
                    to="/profile"
                    onClick={() => setShowMenu(false)}
                    className="sidebar-dropdown-link"
                  >
                    <User size={15} /> Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="sidebar-dropdown-logout"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              </>
            )}
          </div>

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
