import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Search, Bookmark, Clock, BarChart3, Settings, User } from "lucide-react";
import { useSidebarStore } from "@/store/sidebar-store";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/search", label: "Search", icon: Search },
  { path: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { path: "/history", label: "History", icon: Clock },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();
  const isOpen = useSidebarStore((s) => s.isOpen);

  return (
    <aside
      className="fixed left-0 bottom-0 flex flex-col py-5 transition-all duration-200 z-40 glass"
      style={{
        top: "var(--header-height)",
        borderRight: "1px solid var(--border)",
        width: isOpen ? "240px" : "68px",
      }}
    >
      <nav className="flex-1 flex flex-col gap-1.5 px-3">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + "/");
          return (
            <Link
              key={path}
              to={path}
              className="flex items-center gap-3 py-2.5 text-sm font-semibold transition-all"
              style={{
                padding: isOpen ? "12px 18px" : "12px 0",
                justifyContent: isOpen ? "flex-start" : "center",
                borderRadius: "var(--radius-button)",
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "var(--on-primary)" : "var(--text-secondary)",
                boxShadow: isActive ? "0 4px 14px rgba(0, 0, 0, 0.12)" : "none",
              }}
              title={label}
            >
              <Icon size={19} />
              {isOpen && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
