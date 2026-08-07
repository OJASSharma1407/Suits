import React from "react";
import { Gavel } from "lucide-react";

interface JudgeCardProps {
  judges: string[];
}

export function JudgeCard({ judges }: JudgeCardProps) {
  return (
    <div className="card-float p-6 space-y-4">
      <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
        <Gavel size={18} style={{ color: "var(--text-muted)" }} /> Before Hon'ble Judges
      </h3>
      {judges.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No judges listed in the current records.
        </p>
      ) : (
        <ul className="space-y-3">
          {judges.map((j, i) => (
            <li key={i} className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" 
                style={{ background: "var(--surface-container)", color: "var(--text-primary)" }}
              >
                {j.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-medium mt-1.5 leading-tight" style={{ color: "var(--text-primary)" }}>
                {j}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
