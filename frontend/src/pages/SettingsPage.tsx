import React from "react";
import { Settings, Bell, Database, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useThemeStore } from "@/store/theme-store";

export default function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  const handleSave = () => {
    toast.success("Settings saved successfully.");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          Preferences
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Customize your SUITS workspace experience.
        </p>
      </div>

      <div className="card-float p-6 sm:p-8 space-y-8">
        <section>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Settings size={18} style={{ color: "var(--text-muted)" }} /> Display & Layout
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Compact View</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Reduce padding in case lists and tables.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div
                  className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{ background: "var(--border-strong)" }}
                />
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Dark Mode</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Switch between Auralis Light and Auralis Nocturne themes.</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer"
                style={{
                  background: isDark ? "var(--primary)" : "var(--surface-container)",
                  color: isDark ? "var(--on-primary)" : "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  transition: "all 220ms ease",
                }}
              >
                {isDark ? (
                  <><Sun size={14} className="animate-icon-swap" /> Light Mode</>
                ) : (
                  <><Moon size={14} className="animate-icon-swap" /> Dark Mode</>
                )}
              </button>
            </div>
          </div>
        </section>

        <hr style={{ borderColor: "var(--border)" }} />

        <section>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Bell size={18} style={{ color: "var(--text-muted)" }} /> Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Case Updates</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Get notified when bookmarked cases have new orders.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div
                  className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{ background: "var(--border-strong)", backgroundColor: "var(--primary)" }}
                />
              </label>
            </div>
          </div>
        </section>

        <hr style={{ borderColor: "var(--border)" }} />

        <section>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Database size={18} style={{ color: "var(--text-muted)" }} /> Data Management
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Export Data</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Download your bookmarks and history.</p>
              </div>
              <button className="btn-secondary text-xs" style={{ padding: "6px 16px" }}>Export JSON</button>
            </div>
          </div>
        </section>

        <div className="pt-4 flex justify-end">
          <button onClick={handleSave} className="btn-primary">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
