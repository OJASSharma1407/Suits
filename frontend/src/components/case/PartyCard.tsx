import React from "react";
import type { PartyInfo } from "@/types/case";
import { Users, User } from "lucide-react";

interface PartyCardProps {
  parties: PartyInfo;
}

export function PartyCard({ parties }: PartyCardProps) {
  return (
    <div className="card-float p-6 sm:p-8 space-y-6">
      <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
        <Users size={18} /> Parties & Advocates
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Petitioners / Appellants
          </h4>
          <ul className="space-y-2">
            {parties.petitioners.length > 0 ? (
              parties.petitioners.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  <User size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--text-muted)" }} /> 
                  <span>{p}</span>
                </li>
              ))
            ) : (
              <li className="text-sm" style={{ color: "var(--text-muted)" }}>None listed</li>
            )}
          </ul>

          {parties.petitioner_advocates.length > 0 && (
            <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <span className="block text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Advocate</span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{parties.petitioner_advocates.join(", ")}</span>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Respondents / Defendants
          </h4>
          <ul className="space-y-2">
            {parties.respondents.length > 0 ? (
              parties.respondents.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  <User size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--text-muted)" }} /> 
                  <span>{r}</span>
                </li>
              ))
            ) : (
              <li className="text-sm" style={{ color: "var(--text-muted)" }}>None listed</li>
            )}
          </ul>

          {parties.respondent_advocates.length > 0 && (
            <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <span className="block text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Advocate</span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{parties.respondent_advocates.join(", ")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
