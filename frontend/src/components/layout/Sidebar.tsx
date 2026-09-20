import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon, Cpu, Cloud, WifiOff } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useAIModeStore } from "@/store/ai-mode-store";

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
function ResearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <circle cx="11.5" cy="14.5" r="2.5" />
      <path d="m13.5 16.5 2.5 2.5" />
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
  { path: "/research",   label: "Research",   Icon: ResearchIcon },
  { path: "/analytics",  label: "Analytics",  Icon: AnalyticsIcon },
  { path: "/history",    label: "History",    Icon: HistoryIcon },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const {
    mode,
    isOffline,
    setMode,
    getEffectiveProvider,
    checkOllamaHealth,
  } = useAIModeStore();

  const isDark = theme === "dark";
  const effectiveProvider = getEffectiveProvider();

  const handleToggleAIMode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOffline) {
      toast.info("Offline Mode: Local Ollama Qwen 7B is automatically active.");
      return;
    }

    const nextMode = mode === "cloud" ? "local" : "cloud";
    setMode(nextMode);

    if (nextMode === "local") {
      checkOllamaHealth().then(() => {
        const status = useAIModeStore.getState().ollamaStatus;
        if (status.running) {
          toast.success("Switched to Local Ollama (Qwen 7B) — 100% private offline inference");
        } else {
          toast.warning("Local AI selected. Make sure Ollama daemon is running (`ollama serve`).");
        }
      });
    } else {
      toast.success("Switched to Cloud AI (Gemini & OpenRouter)");
    }
  };

  return (
    <aside className="sidebar">
      {/* Logo + Nav grouped at top */}
      <div className="sidebar-top">
        <div className="wordmark">
          <ScalesIcon />
          <span className="mark">SUITS.</span>
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

          {/* Fluent separator */}
          <div
            className="my-1 mx-3 border-t"
            style={{ borderColor: "var(--hairline)", opacity: 0.4 }}
          />

          {/* Fluent Merged AI Engine Nav Item */}
          <div
            onClick={handleToggleAIMode}
            className="nav-item select-none cursor-pointer group"
            style={{
              background:
                effectiveProvider === "local"
                  ? "rgba(39, 174, 96, 0.08)"
                  : undefined,
              borderColor:
                effectiveProvider === "local"
                  ? "rgba(39, 174, 96, 0.28)"
                  : "transparent",
            }}
            title={
              effectiveProvider === "local"
                ? "Local AI Active (Ollama Qwen 7B) — Click to switch to Cloud AI"
                : "Cloud AI Active (Gemini / OpenRouter) — Click to switch to Local Ollama"
            }
          >
            <div className="nav-item-inner flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {isOffline ? (
                  <WifiOff size={18} className="text-amber-500 shrink-0" />
                ) : effectiveProvider === "local" ? (
                  <Cpu size={18} className="text-emerald-500 shrink-0" />
                ) : (
                  <Cloud size={18} style={{ color: "var(--brass-bright)" }} className="shrink-0" />
                )}
                <div className="nav-label flex flex-col text-left leading-tight">
                  <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                    AI Engine
                  </span>
                  <span
                    className="text-[10px] font-mono tracking-tight"
                    style={{
                      color:
                        effectiveProvider === "local"
                          ? "#27ae60"
                          : isOffline
                          ? "#d48806"
                          : "var(--ink-faint)",
                    }}
                  >
                    {isOffline
                      ? "Offline (Qwen 7B)"
                      : effectiveProvider === "local"
                      ? "Local (Qwen 7B)"
                      : "Cloud (Gemini)"}
                  </span>
                </div>
              </div>

              {/* Smooth Micro-Toggle Switch */}
              <div
                className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer"
                style={{
                  backgroundColor:
                    effectiveProvider === "local" ? "var(--brass)" : "var(--hairline)",
                }}
              >
                <motion.span
                  animate={{
                    x: effectiveProvider === "local" ? 17 : 2,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm"
                />
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Footer: Clean Profile pill → /profile + Theme toggle */}
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
