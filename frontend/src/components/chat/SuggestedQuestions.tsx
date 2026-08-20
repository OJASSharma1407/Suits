import React from "react";
import { Sparkles, Scale, BookOpen, Gavel, HelpCircle, FileText } from "lucide-react";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  variant?: "list" | "chips";
  customQuestions?: string[];
}

const DEFAULT_QUESTIONS = [
  { text: "Summarize the key facts and dispute.", icon: <BookOpen size={13} />, label: "Key Facts" },
  { text: "What is the ratio decidendi established in this case?", icon: <Scale size={13} />, label: "Ratio Decidendi" },
  { text: "List the precedents and statutes cited by the parties.", icon: <FileText size={13} />, label: "Precedents & Laws" },
  { text: "Explain the court's substantive reasoning on the merits.", icon: <HelpCircle size={13} />, label: "Court Reasoning" },
  { text: "What specific directions or relief were ordered by the Court?", icon: <Gavel size={13} />, label: "Directives & Relief" },
];

export function SuggestedQuestions({
  onSelect,
  variant = "list",
  customQuestions = [],
}: SuggestedQuestionsProps) {
  if (variant === "chips") {
    const questionsToDisplay = customQuestions.length > 0
      ? customQuestions.map((q) => ({ text: q, label: q, icon: <Sparkles size={11} /> }))
      : DEFAULT_QUESTIONS;

    return (
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none w-full">
        {questionsToDisplay.map((item, i) => (
          <button
            key={i}
            onClick={() => onSelect(item.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-medium whitespace-nowrap transition-all hover:border-[var(--primary)] hover:bg-[var(--surface-container)] cursor-pointer flex-shrink-0"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}
            title={item.text}
          >
            <span style={{ color: "var(--primary)" }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default List View (Empty State)
  const items = customQuestions.length > 0
    ? customQuestions.map((q) => ({ text: q, label: q, icon: <Sparkles size={13} /> }))
    : DEFAULT_QUESTIONS;

  return (
    <div className="w-full max-w-lg space-y-2">
      {items.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q.text)}
          className="w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all hover:-translate-y-0.5 group flex items-center justify-between cursor-pointer"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span style={{ color: "var(--primary)" }}>{q.icon}</span>
            <span className="font-medium">{q.text}</span>
          </div>
          <Sparkles
            size={13}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            style={{ color: "var(--primary)" }}
          />
        </button>
      ))}
    </div>
  );
}
