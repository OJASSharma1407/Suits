import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { getErrorMessage } from "@/lib/error";

interface ErrorStateProps {
  title?: string;
  message?: unknown;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading data. Please try again.",
  onRetry,
}: ErrorStateProps) {
  const displayMessage =
    typeof message === "string"
      ? message
      : getErrorMessage(message, "An error occurred while loading data. Please try again.");

  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center rounded-[24px] border my-4 bg-white card-float"
      style={{
        borderColor: "rgba(220, 38, 38, 0.2)",
      }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(220, 38, 38, 0.1)", color: "var(--danger)" }}>
        <AlertCircle size={24} />
      </div>
      <h3 className="text-base font-semibold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p className="text-sm max-w-sm mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {displayMessage}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary cursor-pointer"
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
