import React from "react";
import { Sparkles, Scale, BookOpen, Gavel, HelpCircle, FileText } from "lucide-react";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  variant?: "list" | "chips";
  customQuestions?: string[];
}

const DEFAULT_QUESTIONS = [
  { text: "Summarize the key facts and dispute.", icon: <BookOpen size={14} />, label: "Key Facts" },
  { text: "What is the ratio decidendi established in this case?", icon: <Scale size={14} />, label: "Ratio Decidendi" },
  { text: "List the precedents and statutes cited by the parties.", icon: <FileText size={14} />, label: "Precedents & Laws" },
  { text: "Explain the court's substantive reasoning on the merits.", icon: <HelpCircle size={14} />, label: "Court Reasoning" },
  { text: "What specific directions or relief were ordered by the Court?", icon: <Gavel size={14} />, label: "Directives & Relief" },
];

export function SuggestedQuestions({
  onSelect,
  variant = "list",
  customQuestions = [],
}: SuggestedQuestionsProps) {
  if (variant === "chips") {
    const questionsToDisplay =
      customQuestions.length > 0
        ? customQuestions.map((q) => ({ text: q, label: q, icon: <Sparkles size={12} /> }))
        : DEFAULT_QUESTIONS;

    return (
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-none w-full mx-auto">
        {questionsToDisplay.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(item.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11.5px] font-medium whitespace-nowrap transition-all duration-150 hover:border-[var(--brass)] hover:bg-[var(--surface-container)] cursor-pointer flex-shrink-0"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
            title={item.text}
          >
            <span style={{ color: "var(--brass)" }} className="flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default List View (Empty State & Drawer)
  const items =
    customQuestions.length > 0
      ? customQuestions.map((q) => ({ text: q, label: q, icon: <Sparkles size={14} /> }))
      : DEFAULT_QUESTIONS;

  return (
    <div className="w-full space-y-2.5">
      {items.map((q, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(q.text)}
          className="w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brass)] hover:bg-[var(--surface-container)] group flex items-center justify-between gap-3 cursor-pointer shadow-xs"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
              style={{ background: "var(--brass-soft)", color: "var(--brass-bright)" }}
            >
              {q.icon}
            </div>
            <span className="text-xs sm:text-[13.5px] font-medium leading-snug truncate sm:whitespace-normal" style={{ color: "var(--ink)" }}>
              {q.text}
            </span>
          </div>
          <Sparkles
            size={14}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            style={{ color: "var(--brass)" }}
          />
        </button>
      ))}
    </div>
  );
}
