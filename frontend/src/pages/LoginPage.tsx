import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { toast } from "sonner";

function ScalesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      style={{ width: 22, height: 22, color: "var(--brass, #c5a880)" }}
    >
      <path d="M12 3v18M5 7l-3 6a3.5 3.5 0 007 0l-3-6zM19 7l-3 6a3.5 3.5 0 007 0l-3-6zM5 7h14M8 21h8" />
    </svg>
  );
}

// Memoized Google Login to prevent re-initializing GSI on every keystroke
const MemoizedGoogleLogin = React.memo(function MemoizedGoogleLogin({
  onSuccess,
  onError,
}: {
  onSuccess: (credentialResponse: any) => void;
  onError: () => void;
}) {
  return (
    <GoogleLogin
      onSuccess={onSuccess}
      onError={onError}
      theme="filled_black"
      shape="rectangular"
      size="large"
      text="continue_with"
      width="320"
    />
  );
});

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((s: { isAuthenticated: boolean }) => s.isAuthenticated);
  const setUser = useAuthStore((s: { setUser: (user: any) => void }) => s.setUser);
  const navigate = useNavigate();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const extractErrorMessage = (err: any): string => {
    if (err.response?.status === 401) {
      return "Invalid email or password. Please check your credentials and try again.";
    }
    if (err.response?.status === 502) {
      return "Backend service is currently unavailable (502 Bad Gateway). Please verify that the backend is running.";
    }
    if (err.response?.status === 500) {
      return "Internal server error. Please try again later.";
    }
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.response?.data?.detail) {
      const detail = err.response.data.detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) {
        return detail
          .map((item: any) => (item.msg ? item.msg.replace(/^Value error,\s*/i, "") : JSON.stringify(item)))
          .join(". ");
      }
      return JSON.stringify(detail);
    }
    if (err.message === "Network Error") {
      return "Unable to connect to SUITS API server. Please check your network connection.";
    }
    return err.message || "Invalid email or password.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tokenData = await authService.login({ email, password });
      localStorage.setItem("access_token", tokenData.access_token);
      localStorage.setItem("refresh_token", tokenData.refresh_token);
      const userProfile = await authService.getProfile();
      setUser(userProfile);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = useCallback(async (credentialResponse: any) => {
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
      toast.success("Signed in with Google!");
      navigate("/dashboard");
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [setUser, navigate]);

  const handleGoogleError = useCallback(() => {
    const msg = "Google sign-in was cancelled or encountered an error.";
    setError(msg);
    toast.error(msg);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-lg, 12px)",
          padding: "44px 40px",
          boxShadow: "var(--shadow-float)",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 32,
          }}
        >
          <ScalesIcon />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "0.01em",
            }}
          >
            Suits
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--ink-faint)",
              textTransform: "uppercase",
              marginLeft: "auto",
            }}
          >
            Sign In
          </span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--ink)",
              margin: "0 0 6px",
            }}
          >
            Sign in
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink-dim)", margin: 0 }}>
            Access your legal research workspace.
          </p>
        </div>

        {/* Google OAuth Login Button (Memoized) */}
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <MemoizedGoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "20px 0",
            color: "var(--ink-faint)",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
          <span>or sign in with email</span>
          <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
        </div>

        {/* Inline Error Alert Box */}
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-faint)",
                marginBottom: 6,
              }}
            >
              Email address
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
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-faint)",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                style={{ paddingRight: 50, width: "100%" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--ink-dim)",
                  padding: "4px 6px",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "11px 20px",
              fontSize: 14,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-dim)",
          }}
        >
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "var(--ink)",
              fontWeight: 500,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
