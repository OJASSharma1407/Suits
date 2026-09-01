import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const setUser = useAuthStore((s: { setUser: (user: any) => void }) => s.setUser);
  const navigate = useNavigate();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Timer countdown for resend button
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus first OTP box on load
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric inputs
    const sanitized = value.replace(/\D/g, "");
    if (!sanitized && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = sanitized.slice(-1); // Take last char
    setOtp(newOtp);

    // Auto-advance to next box
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasteData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pasteData.length; i++) {
        newOtp[i] = pasteData[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pasteData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    if (otpCode.length < 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.verifyOtp({ email, otp: otpCode });
      localStorage.setItem("access_token", result.tokens.access_token);
      localStorage.setItem("refresh_token", result.tokens.refresh_token);
      setUser(result.user);
      toast.success("Email verified! Welcome to SUITS.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }

    setResending(true);
    try {
      await authService.resendOtp({ email });
      toast.success("A fresh verification code has been dispatched to your email.");
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
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
          maxWidth: 440,
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-lg, 12px)",
          padding: "40px 36px",
          boxShadow: "var(--shadow-float)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 28,
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
            Verification
          </span>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--ink)",
              margin: "0 0 6px",
            }}
          >
            Verify your email
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-dim)", margin: 0, lineHeight: 1.5 }}>
            We have sent a 6-digit verification code to{" "}
            <strong style={{ color: "var(--ink)" }}>{email || "your email"}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!initialEmail && (
            <div style={{ marginBottom: 18 }}>
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
                Account Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--hairline)",
                  background: "var(--surface-sunken, rgba(0,0,0,0.2))",
                  color: "var(--ink)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
          )}

          {/* 6-Digit OTP Boxes */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-faint)",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              Enter 6-Digit Code
            </label>
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "center",
              }}
              onPaste={handlePaste}
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  style={{
                    width: "48px",
                    height: "54px",
                    textAlign: "center",
                    fontSize: "22px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono, monospace)",
                    borderRadius: "10px",
                    border: digit ? "1.5px solid var(--brass, #38bdf8)" : "1px solid var(--hairline)",
                    background: "var(--surface-sunken, rgba(0,0,0,0.25))",
                    color: "var(--ink, #ffffff)",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                />
              ))}
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
            {loading ? "Verifying…" : "Verify & Activate Account"}
          </button>
        </form>

        {/* Resend Action */}
        <div
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-dim)",
          }}
        >
          <span>Didn't receive the email? </span>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{
                background: "none",
                border: "none",
                color: "var(--brass, #38bdf8)",
                fontWeight: 500,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              {resending ? "Sending..." : "Resend Code"}
            </button>
          ) : (
            <span style={{ color: "var(--ink-faint)" }}>
              Resend in {countdown}s
            </span>
          )}
        </div>

        <div
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: 13,
            borderTop: "1px solid var(--hairline)",
            paddingTop: 16,
          }}
        >
          <Link
            to="/login"
            style={{
              color: "var(--ink-dim)",
              textDecoration: "none",
            }}
          >
            ← Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
