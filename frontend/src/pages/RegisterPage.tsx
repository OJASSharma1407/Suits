import React, { useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

interface PasswordRule {
  id: string;
  label: string;
  test: (p: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "uppercase", label: "One uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "One lowercase letter (a-z)", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "One number (0-9)", test: (p) => /\d/.test(p) },
  {
    id: "special",
    label: "One special character (!@#$%...)",
    test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p),
  },
];

// Memoized Google Login button to avoid re-initializing GSI on every keystroke
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
      text="signup_with"
      width="320"
    />
  );
});

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  // Compute password rule validations
  const ruleResults = useMemo(() => {
    return PASSWORD_RULES.map((rule) => ({
      ...rule,
      passed: rule.test(password),
    }));
  }, [password]);

  const passedRulesCount = useMemo(() => {
    return ruleResults.filter((r) => r.passed).length;
  }, [ruleResults]);

  const isPasswordStrong = passedRulesCount === PASSWORD_RULES.length;

  const strengthMeta = useMemo(() => {
    if (!password) return { label: "", color: "transparent", percent: 0 };
    if (passedRulesCount <= 2) return { label: "Weak", color: "#ef4444", percent: 30 };
    if (passedRulesCount <= 4) return { label: "Moderate", color: "#f59e0b", percent: 70 };
    return { label: "Strong", color: "#10b981", percent: 100 };
  }, [password, passedRulesCount]);

  const extractErrorMessage = (err: any): string => {
    if (err.response?.status === 409) {
      return "An account with this email address already exists. Please sign in instead.";
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
    return err.message || "Registration failed. Please check your details and try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordStrong) {
      const failing = ruleResults.find((r) => !r.passed)?.label;
      const msg = failing
        ? `Password is too weak. Requirement missing: ${failing}.`
        : "Password must meet all security requirements.";
      setError(msg);
      toast.error(msg);
      return;
    }

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
      toast.success("Account created & signed in with Google!");
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

        {/* Google OAuth Login Button (Memoized) */}
        <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <MemoizedGoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                Password
              </label>
              {password && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: strengthMeta.color,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                  }}
                >
                  {strengthMeta.label}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Must be a strong password"
                className="w-full p-3 pr-10 text-sm border outline-none"
                style={{
                  background: "var(--surface)",
                  borderColor: isPasswordStrong
                    ? "rgba(16, 185, 129, 0.4)"
                    : error
                    ? "rgba(239, 68, 68, 0.4)"
                    : "var(--border)",
                  color: "var(--text-primary)",
                  borderRadius: "var(--radius-input)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px 6px",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Password Strength Progress Bar */}
            {password && (
              <div
                style={{
                  width: "100%",
                  height: 4,
                  background: "var(--hairline, rgba(255,255,255,0.08))",
                  borderRadius: 2,
                  marginTop: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${strengthMeta.percent}%`,
                    background: strengthMeta.color,
                    transition: "width 0.3s ease, background-color 0.3s ease",
                  }}
                />
              </div>
            )}

            {/* Password Security Requirements Checklist */}
            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--hairline)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Password must contain:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px" }}>
                {ruleResults.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: r.passed ? "#10b981" : "var(--text-muted)",
                      transition: "color 0.2s ease",
                    }}
                  >
                    <span>{r.passed ? "✓" : "○"}</span>
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50 cursor-pointer"
            style={{ marginTop: 20 }}
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
