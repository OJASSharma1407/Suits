import React, { useState } from "react";
import { Scale, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CitationChipProps {
  citation: string;
}

export function CitationChip({ citation }: CitationChipProps) {
  const [copied, setCopied] = useState(false);

  const cleanCitation = citation.trim();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanCitation);
    setCopied(true);
    toast.success(`Copied citation: ${cleanCitation}`, { duration: 2000 });
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <span
      onClick={handleCopy}
      title="Click to copy legal citation"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded-md font-mono text-[11px] font-semibold border transition-all cursor-pointer select-none group align-middle"
      style={{
        background: copied ? "rgba(22, 163, 74, 0.08)" : "var(--surface-container-high)",
        borderColor: copied ? "rgba(22, 163, 74, 0.4)" : "var(--border)",
        color: copied ? "var(--success)" : "var(--text-primary)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      <Scale size={11} style={{ color: copied ? "var(--success)" : "var(--primary)" }} />
      <span className="truncate max-w-[260px]">{cleanCitation}</span>
      {copied ? (
        <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-sans font-medium">
          <Check size={10} /> Copied!
        </span>
      ) : (
        <Copy
          size={10}
          className="opacity-40 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--text-muted)" }}
        />
      )}
    </span>
  );
}

// Regex matching common Indian & international legal citations:
// e.g. [2019] SCC OnLine NCLAT 388, (2021) 4 SCC 123, AIR 2020 SC 1420, W.P.(C) 3362/2015, etc.
const CITATION_REGEX =
  /(\[\d{4}\]\s+(?:SCC|SCC\s+OnLine|SCR|AIR|Scale|INSC|DHC|BOM|DLT|GLR|NCLAT|NCLT|ITR|LLJ)[^\]\n,;]+\]?|(?:\(\d{4}\)|\b\d{4}\b)\s+\d+\s+(?:SCC|SCR|AIR|Scale|CrLJ|Comp\s*Cas|BLR)\s+[0-9A-Za-z\s]+|AIR\s+\d{4}\s+(?:SC|Del|Bom|Cal|Mad|All|Ker|Guj|Pat|MP)\s+\d+|W\.P\.\s*(?:\([A-Za-z]+\))?\s*(?:No\.?)?\s*\d+\s*(?:of|\/)\s*\d{4})/g;

export function renderTextWithCitations(text: string): React.ReactNode {
  if (!text || typeof text !== "string") return text;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  CITATION_REGEX.lastIndex = 0;

  while ((match = CITATION_REGEX.exec(text)) !== null) {
    const citation = match[0];
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, startIndex));
    }

    parts.push(<CitationChip key={`cite-${startIndex}`} citation={citation} />);
    lastIndex = startIndex + citation.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}
