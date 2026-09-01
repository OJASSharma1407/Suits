import { useState, useEffect } from "react";
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const msg = err.response?.data?.message || "Invalid credentials.";
      toast.error(msg);
      // If unverified, redirect to OTP verification screen
      if (err.response?.status === 403 && msg.toLowerCase().includes("verify your email")) {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    console.log("Google Credential response received:", credentialResponse);
    if (!credentialResponse?.credential) {
      toast.error("Google sign-in failed: No credential token received from Google.");
      return;
    }
    setLoading(true);
    try {
      const result = await authService.googleLogin({ credential: credentialResponse.credential });
      console.log("Google Login API Success:", result);
      localStorage.setItem("access_token", result.tokens.access_token);
      localStorage.setItem("refresh_token", result.tokens.refresh_token);
      setUser(result.user);
      toast.success("Signed in with Google!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Google login backend error:", err);
      toast.error(err.response?.data?.message || "Google authentication failed on server.");
    } finally {
      setLoading(false);
    }
  };

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

        {/* Google OAuth Login Button */}
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google sign-in was cancelled or failed.")}
              theme="filled_black"
              shape="rectangular"
              size="large"
              text="continue_with"
              width="100%"
            />
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
              onChange={(e) => setEmail(e.target.value)}
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
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
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
            fontSize: 13.5,
            color: "var(--ink-faint)",
          }}
        >
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "var(--brass)",
              fontWeight: 500,
            }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
