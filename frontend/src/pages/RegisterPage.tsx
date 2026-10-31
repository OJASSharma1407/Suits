import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((s: { isAuthenticated: boolean }) => s.isAuthenticated);
  const setUser = useAuthStore((s: { setUser: (user: any) => void }) => s.setUser);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const extractErrorMessage = (err: any): string => {
    if (err.response?.status === 502) {
      return "Backend service is currently unavailable (502 Bad Gateway). Please ensure the backend is running.";
    }
    if (err.response?.status === 500) {
      return "Internal server error. Please try again later.";
    }
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.response?.data?.detail) {
      return typeof err.response.data.detail === "string"
        ? err.response.data.detail
        : JSON.stringify(err.response.data.detail);
    }
    if (err.message === "Network Error") {
      return "Unable to connect to SUITS API server. Please check your network connection.";
    }
    return err.message || "Registration failed. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authService.register({ full_name: fullName, email, password });
      if (result?.tokens?.access_token) {
        localStorage.setItem("access_token", result.tokens.access_token);
        localStorage.setItem("refresh_token", result.tokens.refresh_token);
        setUser(result.user);
        toast.success("Account created! Welcome to SUITS.");
        navigate("/dashboard");
      } else {
        toast.success("Account created successfully! Please sign in.");
        navigate("/login");
      }
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(null);
    if (!credentialResponse?.credential) {
      const msg = "Google sign-in failed: No credential token received from Google.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setLoading(true);
    try {
      const result = await authService.googleLogin({ credential: credentialResponse.credential });
      localStorage.setItem("access_token", result.tokens.access_token);
      localStorage.setItem("refresh_token", result.tokens.refresh_token);
      setUser(result.user);
      toast.success("Account created & signed in with Google!");
      navigate("/dashboard");
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <div className="orb orb-1" style={{ top: "15%", right: "8%", opacity: 0.3 }} />
      <div className="orb orb-2" style={{ bottom: "5%", left: "10%", opacity: 0.25 }} />

      <div className="w-full max-w-md card-float p-10 space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight mb-1"
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
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Create your legal intelligence account
          </p>
        </div>

        {/* Google OAuth Login Button */}
        <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              const msg = "Google sign-in was cancelled or encountered an error.";
              setError(msg);
              toast.error(msg);
            }}
            theme="filled_black"
            shape="rectangular"
            size="large"
            text="signup_with"
            width="320"
          />
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "16px 0",
            color: "var(--ink-faint)",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
          <span>or create with email</span>
          <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
        </div>

        {/* Inline Error Alert Box */}
        {error && (
          <div
            role="alert"
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#f87171",
              fontSize: 13,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Your full name"
              className="w-full p-3 text-sm border outline-none"
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
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              className="w-full p-3 text-sm border outline-none"
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
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••••••"
              className="w-full p-3 text-sm border outline-none"
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
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" className="font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
