import React, { useState } from "react";
import {
  X,
  FileText,
  BookmarkCheck,
  Bookmark,
  Tag,
  Trash2,
  ChevronRight,
  Plus,
  Loader2,
  Printer,
  Scale,
} from "lucide-react";
import type { PDFHighlight } from "@/types/file";

interface ReaderResearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  caseTitle: string;
  courtName: string;
  orderDate: string;
  cnr: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  highlights: PDFHighlight[];
  onDeleteHighlight: (id: string) => void;
  onJumpToHighlight?: (pageNum: number) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  isSaved: boolean;
  isSaving: boolean;
  onSaveToFiles: () => void;
  onOpenBriefModal: () => void;
  className?: string;
}

export function ReaderResearchPanel({
  isOpen,
  onClose,
  caseTitle,
  courtName,
  orderDate,
  cnr,
  notes,
  onNotesChange,
  highlights,
  onDeleteHighlight,
  onJumpToHighlight,
  tags,
  onTagsChange,
  isSaved,
  isSaving,
  onSaveToFiles,
  onOpenBriefModal,
  className = "",
}: ReaderResearchPanelProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "pointers" | "tags">("notes");
  const [newTagInput, setNewTagInput] = useState("");

  if (!isOpen) return null;

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = newTagInput.trim().replace(/^#+/, "");
    if (cleanTag && !tags.includes(cleanTag)) {
      onTagsChange([...tags, cleanTag]);
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((t) => t !== tagToRemove));
  };

  const colorHexMap: Record<string, string> = {
    gold: "#F59E0B",
    green: "#10B981",
    purple: "#8B5CF6",
    blue: "#3B82F6",
  };

  return (
    <div
      className={`w-[380px] sm:w-[410px] md:w-[430px] h-full flex flex-col border-r flex-shrink-0 select-none animate-fade-in ${className}`}
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      {/* Drawer Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b select-none flex-shrink-0"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "var(--brass-soft)",
              color: "var(--brass)",
              border: "1px solid var(--hairline)",
            }}
          >
            <Scale size={13} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold font-display tracking-tight" style={{ color: "var(--ink)" }}>
              Research Workspace
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Save status badge */}
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1"
            style={{
              background: isSaved ? "rgba(16, 185, 129, 0.12)" : "var(--surface-container)",
              color: isSaved ? "#10B981" : "var(--text-muted)",
              borderColor: isSaved ? "rgba(16, 185, 129, 0.3)" : "var(--border)",
            }}
          >
            {isSaved ? <BookmarkCheck size={10} /> : <Bookmark size={10} />}
            {isSaved ? "Saved" : "Draft"}
          </span>

          <button
            onClick={onClose}
            className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: "var(--ink)" }}
            title="Close Research Panel"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Drawer Segmented Navigation */}
      <div
        className="flex items-center gap-1 px-3 py-1.5 border-b text-xs select-none flex-shrink-0"
        style={{
          background: "var(--surface-dim)",
          borderColor: "var(--border)",
        }}
      >
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex-1 py-1 rounded-md font-medium text-[11px] text-center transition-all cursor-pointer ${
            activeTab === "notes" ? "shadow-sm font-semibold" : "opacity-70 hover:opacity-100"
          }`}
          style={{
            background: activeTab === "notes" ? "var(--card)" : "transparent",
            color: activeTab === "notes" ? "var(--brass)" : "var(--text-secondary)",
            border: activeTab === "notes" ? "1px solid var(--border)" : "1px solid transparent",
          }}
        >
          📝 Notes
        </button>

        <button
          onClick={() => setActiveTab("pointers")}
          className={`flex-1 py-1 rounded-md font-medium text-[11px] text-center transition-all cursor-pointer ${
            activeTab === "pointers" ? "shadow-sm font-semibold" : "opacity-70 hover:opacity-100"
          }`}
          style={{
            background: activeTab === "pointers" ? "var(--card)" : "transparent",
            color: activeTab === "pointers" ? "var(--brass)" : "var(--text-secondary)",
            border: activeTab === "pointers" ? "1px solid var(--border)" : "1px solid transparent",
          }}
        >
          📌 Pointers ({highlights.length})
        </button>

        <button
          onClick={() => setActiveTab("tags")}
          className={`py-1 px-2 rounded-md font-medium text-[11px] text-center transition-all cursor-pointer ${
            activeTab === "tags" ? "shadow-sm font-semibold" : "opacity-70 hover:opacity-100"
          }`}
          style={{
            background: activeTab === "tags" ? "var(--card)" : "transparent",
            color: activeTab === "tags" ? "var(--brass)" : "var(--text-secondary)",
            border: activeTab === "tags" ? "1px solid var(--border)" : "1px solid transparent",
          }}
        >
          🏷️ Tags ({tags.length})
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {/* TAB 1: EXECUTIVE NOTES & ARGUMENTS */}
        {activeTab === "notes" && (
          <div className="h-full flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted uppercase font-mono text-[9.5px] tracking-wider">
                TRIAL NOTES & STRATEGY
              </span>
              <span className="text-[10px] font-mono text-muted">
                {notes.length} characters
              </span>
            </div>

            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Draft legal arguments, contradictions, judge observations, and hearing strategy..."
              className="flex-1 w-full min-h-[380px] p-3 rounded-xl border text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-[var(--brass)] transition-all font-sans"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--ink)",
              }}
            />
          </div>
        )}

        {/* TAB 2: CAPTURED HIGHLIGHTS & POINTERS */}
        {activeTab === "pointers" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-0.5">
              <span className="font-semibold text-muted uppercase font-mono text-[9.5px] tracking-wider">
                KEY HIGHLIGHTED EXCERPTS
              </span>
              <span className="text-[10px] font-mono text-muted">
                {highlights.length} {highlights.length === 1 ? "Citation" : "Citations"}
              </span>
            </div>

            {highlights.length === 0 ? (
              <div
                className="p-6 text-center rounded-xl border space-y-2 my-4"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center bg-[var(--surface-container)] text-muted text-sm">
                  📌
                </div>
                <h4 className="text-xs font-semibold" style={{ color: "var(--ink)" }}>
                  No Highlights Captured Yet
                </h4>
                <p className="text-[10.5px] text-muted max-w-xs mx-auto leading-relaxed">
                  Select text in the PDF or judgment. A floating toolbar will appear to save excerpts here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {highlights.map((h, idx) => {
                  const accentColor = colorHexMap[h.color] || "#F59E0B";
                  return (
                    <div
                      key={h.id || idx}
                      className="p-2.5 rounded-xl border transition-all relative group space-y-1.5"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--hairline)",
                        borderLeft: `3px solid ${accentColor}`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className="px-1.5 py-0.2 rounded font-mono text-[9.5px] font-bold"
                          style={{
                            background: `${accentColor}18`,
                            color: accentColor,
                          }}
                        >
                          Page {h.pageNum}
                        </span>

                        <div className="flex items-center gap-1">
                          {onJumpToHighlight && (
                            <button
                              onClick={() => onJumpToHighlight(h.pageNum)}
                              className="p-1 rounded hover:bg-[var(--surface-container)] text-muted hover:text-[var(--brass)] transition-colors cursor-pointer"
                              title={`Jump to Page ${h.pageNum}`}
                            >
                              <ChevronRight size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteHighlight(h.id)}
                            className="p-1 rounded hover:bg-[var(--surface-container)] text-muted hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete Highlight"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <p
                        className="text-[11px] leading-relaxed italic line-clamp-4 select-text"
                        style={{ color: "var(--ink)" }}
                      >
                        "{h.text}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TAGS & CLASSIFICATION */}
        {activeTab === "tags" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <span className="font-semibold text-muted uppercase font-mono text-[9.5px] tracking-wider">
                CASE CLASSIFICATION TAGS
              </span>

              <form onSubmit={handleAddTag} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Add a tag (e.g. Arbitration)..."
                  className="flex-1 px-2.5 py-1 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[var(--brass)]"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--ink)",
                  }}
                />
                <button
                  type="submit"
                  disabled={!newTagInput.trim()}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  style={{
                    background: "var(--brass)",
                    color: "var(--on-primary)",
                    borderColor: "var(--brass-bright)",
                  }}
                >
                  <Plus size={12} /> Add
                </button>
              </form>
            </div>

            {/* Active Tags */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono text-muted uppercase">Active Tags</span>
              {tags.length === 0 ? (
                <p className="text-xs text-muted italic">No tags assigned yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-mono font-medium"
                      style={{
                        background: "var(--surface-container)",
                        borderColor: "var(--border)",
                        color: "var(--brass)",
                      }}
                    >
                      <Tag size={10} />
                      <span>#{t}</span>
                      <button
                        onClick={() => handleRemoveTag(t)}
                        className="opacity-60 hover:opacity-100 hover:text-red-500 cursor-pointer ml-0.5"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Suggested Tags */}
            <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <span className="text-[10px] font-mono text-muted uppercase">Suggested</span>
              <div className="flex flex-wrap gap-1">
                {["Arbitration", "BailConditions", "CommercialBreach", "StayOrder", "WritPetition", "EvidenceExclusion"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      if (!tags.includes(s)) onTagsChange([...tags, s]);
                    }}
                    className="px-2 py-0.5 rounded text-[10.5px] font-mono border hover:bg-[var(--surface-container)] transition-colors cursor-pointer"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--hairline)",
                      color: "var(--ink-dim)",
                    }}
                  >
                    + #{s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Action Footer: Gold "Save to Research Vault" + Ghost "Export" */}
      <div
        className="p-3 border-t flex flex-col gap-2 select-none flex-shrink-0"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          {/* Save to Research Vault Button */}
          <button
            onClick={onSaveToFiles}
            disabled={isSaving}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            style={{
              background: "var(--brass)",
              color: "var(--on-primary)",
              border: "1px solid var(--brass-bright)",
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Saving…</span>
              </>
            ) : isSaved ? (
              <>
                <BookmarkCheck size={13} />
                <span>Saved to Research Vault</span>
              </>
            ) : (
              <>
                <Bookmark size={13} />
                <span>Save to Research Vault</span>
              </>
            )}
          </button>

          {/* Export Research Brief Button */}
          <button
            onClick={onOpenBriefModal}
            className="py-2 px-2.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1 transition-all hover:bg-[var(--surface-hover)] cursor-pointer"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--ink)",
            }}
            title="Export Case Research Brief"
          >
            <Printer size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
