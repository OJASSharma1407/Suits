import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Shield, Save, KeyRound, Loader2, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { authService } from "@/services/auth";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await authService.updateProfile({ full_name: fullName });
      setUser(updated);
      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  return (
    <div className="dashboard-layout" style={{ maxWidth: "720px", margin: "36px auto 60px", width: "100%" }}>
      {/* Centered Page Header (subtitle removed) */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-medium tracking-tight"
          style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
        >
          Profile & Account
        </h1>
      </div>

      <div
        className="card-float p-6 sm:p-8 space-y-8"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-md)",
        }}
      >
        {/* Profile Info Form */}
        <section>
          <h3
            className="text-base font-medium mb-5 flex items-center gap-2.5"
            style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
          >
            <User size={18} style={{ color: "var(--brass)" }} /> Personal Information
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div>
              <label
                className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
              >
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 text-sm border outline-none transition-colors"
                style={{
                  background: "var(--surface-raised)",
                  borderColor: "var(--hairline)",
                  color: "var(--ink)",
                  borderRadius: "var(--radius)",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--ink-faint)" }}
                />
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full pl-10 pr-3 py-3 text-sm border outline-none cursor-not-allowed opacity-75"
                  style={{
                    background: "var(--surface-raised)",
                    borderColor: "var(--hairline)",
                    color: "var(--ink-dim)",
                    borderRadius: "var(--radius)",
                    fontFamily: "var(--font-sans)",
                  }}
                />
              </div>
              <p className="text-[11.5px] mt-1.5" style={{ color: "var(--ink-faint)" }}>
                Email cannot be changed. Contact support for assistance.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || fullName === user?.full_name}
                className="btn btn-primary flex items-center gap-2"
                style={{ padding: "9px 22px" }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </section>

        <hr style={{ borderColor: "var(--hairline-soft)" }} />

        {/* Security Form */}
        <section>
          <h3
            className="text-base font-medium mb-5 flex items-center gap-2.5"
            style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
          >
            <Shield size={18} style={{ color: "var(--brass)" }} /> Security Settings
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label
                className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
              >
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 text-sm border outline-none transition-colors"
                style={{
                  background: "var(--surface-raised)",
                  borderColor: "var(--hairline)",
                  color: "var(--ink)",
                  borderRadius: "var(--radius)",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
              >
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 text-sm border outline-none transition-colors"
                style={{
                  background: "var(--surface-raised)",
                  borderColor: "var(--hairline)",
                  color: "var(--ink)",
                  borderRadius: "var(--radius)",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>

            <div className="pt-1 flex items-center justify-between gap-4">
              <button
                type="submit"
                disabled={pwdLoading || !currentPassword || !newPassword}
                className="btn btn-primary flex items-center gap-2"
                style={{ padding: "9px 22px" }}
              >
                {pwdLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                <span>Update Password</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="btn flex items-center gap-2 cursor-pointer transition-all duration-150"
                style={{
                  padding: "9px 20px",
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "var(--danger)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "var(--radius)",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.16)";
                  e.currentTarget.style.borderColor = "var(--danger)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.25)";
                }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
