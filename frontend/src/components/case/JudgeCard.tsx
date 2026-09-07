import React, { useState } from "react";
import { Gavel, Sparkles, ChevronRight } from "lucide-react";
import { JudgeDossierSlideOver } from "./judge/JudgeDossierSlideOver";

interface JudgeCardProps {
  judges: string[];
  courtName?: string | null;
}

export function JudgeCard({ judges, courtName }: JudgeCardProps) {
  const [selectedJudge, setSelectedJudge] = useState<string | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const handleOpenDossier = (judge: string) => {
    setSelectedJudge(judge);
    setIsDossierOpen(true);
  };

  return (
    <>
      <div className="card-float p-6 sm:p-8 space-y-6 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <h3
            className="text-lg font-semibold tracking-tight flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <Gavel size={18} style={{ color: "var(--brass)" }} />
            <span>Before Hon'ble Judges</span>
          </h3>

          {judges.length > 0 && (
            <span
              className="text-[11px] font-mono px-2 py-0.5 rounded border font-semibold"
              style={{
                background: "var(--surface-container)",
                borderColor: "var(--hairline-soft)",
                color: "var(--ink-faint)",
              }}
            >
              {judges.length} {judges.length === 1 ? "Judge" : "Bench"}
            </span>
          )}
        </div>

        {judges.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No judges listed in the current records.
          </p>
        ) : (
          <div className="space-y-3 flex-1">
            <p className="text-xs" style={{ color: "var(--ink-dim)" }}>
              Click any judge to open their complete Judicial Analytics Dossier & oral argument insights.
            </p>

            <ul className="space-y-2.5">
              {judges.map((j, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => handleOpenDossier(j)}
                    className="w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group hover:border-[var(--brass)] hover:shadow-sm"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--hairline)",
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono border transition-transform group-hover:scale-105"
                        style={{
                          background: "var(--brass-soft)",
                          color: "var(--brass)",
                          borderColor: "var(--brass)",
                        }}
                      >
                        {j.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span
                          className="text-sm font-semibold leading-tight block truncate group-hover:text-[var(--brass)] transition-colors"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {j}
                        </span>
                        <span
                          className="text-[11px] font-mono flex items-center gap-1 mt-0.5"
                          style={{ color: "var(--ink-faint)" }}
                        >
                          <Sparkles size={10} className="text-amber-500" />
                          <span>Bench Intelligence Available</span>
                        </span>
                      </div>
                    </div>

                    <div
                      className="p-1.5 rounded-lg border flex-shrink-0 transition-colors group-hover:bg-[var(--surface-container)]"
                      style={{
                        borderColor: "var(--hairline-soft)",
                        color: "var(--ink-dim)",
                      }}
                      title="Inspect Judicial Dossier"
                    >
                      <ChevronRight size={15} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Slide-over Dossier Panel */}
      <JudgeDossierSlideOver
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        judgeName={selectedJudge}
        courtName={courtName}
      />
    </>
  );
}
