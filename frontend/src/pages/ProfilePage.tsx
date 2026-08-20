import React, { useState } from "react";
import { User, Mail, Shield, Save } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { authService } from "@/services/auth";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          Profile & Account
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Manage your personal information and security settings.
        </p>
      </div>

      <div className="card-float p-6 sm:p-8 space-y-8">
        {/* Profile Info Form */}
        <section>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <User size={18} style={{ color: "var(--text-muted)" }} /> Personal Information
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 text-sm border outline-none"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  borderRadius: "var(--radius-input)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full pl-9 pr-3 py-2.5 text-sm border outline-none cursor-not-allowed opacity-70"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                    borderRadius: "var(--radius-input)",
                  }}
                />
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                Email cannot be changed. Contact support for assistance.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || fullName === user?.full_name}
              className="btn-primary"
            >
              <Save size={16} /> Save Changes
            </button>
          </form>
        </section>

        <hr style={{ borderColor: "var(--border)" }} />

        {/* Security Form */}
        <section>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Shield size={18} style={{ color: "var(--text-muted)" }} /> Security Settings
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2.5 text-sm border outline-none"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  borderRadius: "var(--radius-input)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2.5 text-sm border outline-none"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  borderRadius: "var(--radius-input)",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={pwdLoading || !currentPassword || !newPassword}
              className="btn-secondary"
            >
              Update Password
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
