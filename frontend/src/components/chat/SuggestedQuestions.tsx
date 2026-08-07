import React from "react";
import { Sparkles } from "lucide-react";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const QUESTIONS = [
  "Summarize the key facts of this case.",
  "What is the ratio decidendi in the final judgment?",
  "List the precedents cited by the appellant.",
  "Explain the court's reasoning for denying bail.",
];

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="w-full max-w-lg space-y-2">
      {QUESTIONS.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className="w-full text-left p-3 rounded-xl border text-sm transition-all hover:-translate-y-0.5 group flex items-center justify-between"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <span>{q}</span>
          <Sparkles size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }} />
        </button>
      ))}
    </div>
  );
}
