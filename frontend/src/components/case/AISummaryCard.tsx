import React from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { useState } from "react";

interface AISummaryCardProps {
  summary?: string | null;
  plainLanguage?: string | null;
  issues?: string[];
  reasoning?: string | null;
  ratioDecidendi?: string | null;
  directions?: string[];
}

export function AISummaryCard({
  summary,
  plainLanguage,
  issues = [],
  reasoning,
  ratioDecidendi,
  directions = [],
}: AISummaryCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = [
      summary && `## Executive Summary\n${summary}`,
      plainLanguage && `## Plain Language Explanation\n${plainLanguage}`,
      issues.length > 0 && `## Key Issues\n${issues.join("\n")}`,
      reasoning && `## Court Reasoning\n${reasoning}`,
      ratioDecidendi && `## Ratio Decidendi\n${ratioDecidendi}`,
      directions.length > 0 && `## Court Directions\n${directions.join("\n")}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // FIX: Include directions in the check for empty state
  if (!summary && !plainLanguage && issues.length === 0 && directions.length === 0) {
    return null;
  }

  return (
    <div
      className="card-float p-8 space-y-8 relative overflow-hidden"
    >
      <div 
        className="absolute top-0 left-0 w-1 h-full"
        style={{ background: "var(--primary)" }}
      />
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Sparkles size={18} /> AI Order Intelligence
        </h3>
        <button
          onClick={handleCopy}
          className="btn-ghost text-xs"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {summary && (
        <div>
          <h4 className="text-xs uppercase font-semibold tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Executive Summary
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {summary}
          </p>
        </div>
      )}

      {plainLanguage && (
        <div className="p-4 rounded-2xl" style={{ background: "var(--surface-container)" }}>
          <h4 className="text-xs uppercase font-semibold tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <Sparkles size={12} /> Plain Language Explanation
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {plainLanguage}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {issues.length > 0 && (
          <div>
            <h4 className="text-xs uppercase font-semibold tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Key Legal Issues
            </h4>
            <ul className="list-disc list-inside text-sm space-y-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        
        {directions.length > 0 && (
          <div>
            <h4 className="text-xs uppercase font-semibold tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Court Directions
            </h4>
            <ul className="list-disc list-inside text-sm space-y-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {directions.map((dir, i) => (
                <li key={i}>{dir}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {reasoning && (
        <div>
          <h4 className="text-xs uppercase font-semibold tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Court Reasoning
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {reasoning}
          </p>
        </div>
      )}

      {ratioDecidendi && (
        <div>
          <h4 className="text-xs uppercase font-semibold tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Ratio Decidendi
          </h4>
          <blockquote className="text-sm leading-relaxed italic p-4 rounded-xl border-l-4" style={{ borderColor: "var(--primary)", background: "var(--surface-container)", color: "var(--text-primary)" }}>
            "{ratioDecidendi}"
          </blockquote>
        </div>
      )}
    </div>
  );
}
