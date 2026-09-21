import React, { useState, useEffect } from "react";
import { LegalEditor } from "@/components/document/LegalEditor";
import { DocumentChatDrawer } from "@/components/document/DocumentChatDrawer";
import {
  FileText,
  Plus,
  Trash2,
  FolderOpen,
  Copy,
  Clock,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

interface DraftItem {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const STORAGE_KEY = "suits_legal_drafts_v1";

const DEFAULT_SAMPLE_DRAFT: DraftItem = {
  id: "draft-1",
  title: "Writ Petition (Civil) — Delhi High Court",
  updatedAt: new Date().toISOString(),
  content: `
    <div style="text-align: center; font-weight: bold; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 1.15em; letter-spacing: 0.04em;">IN THE HIGH COURT OF DELHI AT NEW DELHI</p>
      <p style="margin: 4px 0 0 0; font-size: 0.9em; font-style: italic; font-weight: normal;">(EXTRAORDINARY ORIGINAL WRIT JURISDICTION)</p>
      <p style="margin: 12px 0 0 0; font-size: 1.05em;">WRIT PETITION (CIVIL) NO. _________ OF 2026</p>
    </div>
    <div style="margin-bottom: 14px;">
      <p style="margin: 0; font-weight: bold;">IN THE MATTER OF:</p>
    </div>
    <div style="margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td style="vertical-align: top; width: 75%;">
            <b>RAMESH CHANDRA & ORS.</b><br/>
            S/o Late Shri Shyam Lal, Aged about 52 Years,<br/>
            Resident of C-42, Defence Colony, New Delhi - 110024
          </td>
          <td style="vertical-align: bottom; text-align: right; width: 25%;">
            <b>...PETITIONER</b>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="text-align: center; padding: 10px 0; font-weight: bold; letter-spacing: 0.1em;">
            VERSUS
          </td>
        </tr>
        <tr>
          <td style="vertical-align: top; width: 75%;">
            <b>1. UNION OF INDIA</b><br/>
            Through Secretary, Ministry of Finance,<br/>
            North Block, New Delhi - 110001.<br/><br/>
            <b>2. RESERVE BANK OF INDIA</b><br/>
            Through its Regional Director,<br/>
            Sansad Marg, New Delhi - 110001.
          </td>
          <td style="vertical-align: bottom; text-align: right; width: 25%;">
            <b>...RESPONDENTS</b>
          </td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 20px 0 14px 0; font-weight: bold; letter-spacing: 0.08em;">
      MOST RESPECTFULLY SHEWETH:
    </div>
    <p style="text-indent: 40px; margin-bottom: 14px; text-align: justify;">
      1. That the Petitioner is a law-abiding citizen of India residing at the aforesaid address and is approaching this Hon'ble Court invoking its extraordinary prerogative jurisdiction under Article 226 of the Constitution of India.
    </p>
    <p style="text-indent: 40px; margin-bottom: 14px; text-align: justify;">
      2. That the brief facts giving rise to the instant petition are that the Respondent issued an ex-parte directive dated 12.08.2026 without affording an opportunity of hearing, in gross violation of the fundamental rights guaranteed under Articles 14, 19(1)(g), and 21 of the Constitution of India.
    </p>
    <div style="text-align: center; margin: 24px 0 16px 0; font-weight: bold; letter-spacing: 0.05em;">
      GROUNDS
    </div>
    <p style="margin-bottom: 12px; text-align: justify;">
      <b>A. FOR THAT</b> the impugned order has been passed in complete violation of the principles of natural justice and fair play.
    </p>
    <p style="margin-bottom: 12px; text-align: justify;">
      <b>B. FOR THAT</b> the Hon'ble Supreme Court in landmark precedent has unequivocally held that any executive action visiting civil consequences must comply with procedural fairness.
    </p>
    <div style="text-align: center; margin: 26px 0 16px 0; font-weight: bold; letter-spacing: 0.05em;">
      PRAYER
    </div>
    <p style="text-align: justify; margin-bottom: 14px;">
      Wherefore, in the light of the facts and circumstances stated hereinabove, it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:
    </p>
    <p style="margin-left: 30px; margin-bottom: 12px; text-align: justify;">
      <b>(a)</b> Issue an appropriate writ, order, or direction in the nature of Certiorari quashing the impugned order dated 12.08.2026; and
    </p>
    <p style="margin-left: 30px; margin-bottom: 16px; text-align: justify;">
      <b>(b)</b> Pass such other or further order(s) as this Hon'ble Court may deem fit and proper in the interest of justice.
    </p>
    <div style="text-align: center; margin: 20px 0; font-weight: bold; font-size: 0.95em;">
      AND FOR THIS ACT OF KINDNESS, THE PETITIONER SHALL AS IN DUTY BOUND EVER PRAY.
    </div>
  `,
};

export default function DocumentPage() {
  const [drafts, setDrafts] = useState<DraftItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [DEFAULT_SAMPLE_DRAFT];
  });

  const [activeDraftId, setActiveDraftId] = useState<string>(() => {
    return drafts[0]?.id || "draft-1";
  });

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());
  const [showDraftsDrawer, setShowDraftsDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeDraft = drafts.find((d) => d.id === activeDraftId) || drafts[0];

  // Save drafts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch {
      // storage quota or error
    }
  }, [drafts]);

  const handleContentSave = (newContent: string) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === activeDraftId
          ? { ...d, content: newContent, updatedAt: new Date().toISOString() }
          : d
      )
    );
    setLastSavedAt(new Date());
  };

  const handleTitleChange = (newTitle: string) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === activeDraftId
          ? { ...d, title: newTitle, updatedAt: new Date().toISOString() }
          : d
      )
    );
    toast.success("Document renamed");
  };

  const handleCreateNewDraft = () => {
    const newId = `draft-${Date.now()}`;
    const newDraft: DraftItem = {
      id: newId,
      title: `Untitled Legal Pleading ${drafts.length + 1}`,
      content: "",
      updatedAt: new Date().toISOString(),
    };
    setDrafts((prev) => [newDraft, ...prev]);
    setActiveDraftId(newId);
    setShowDraftsDrawer(false);
    toast.success("Created new legal document");
  };

  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (drafts.length <= 1) {
      toast.error("Cannot delete the only document. Create another draft first.");
      return;
    }
    if (confirm("Delete this document draft?")) {
      const filtered = drafts.filter((d) => d.id !== id);
      setDrafts(filtered);
      if (activeDraftId === id) {
        setActiveDraftId(filtered[0].id);
      }
      toast.info("Draft deleted");
    }
  };

  const handleDuplicateDraft = (draft: DraftItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `draft-${Date.now()}`;
    const copy: DraftItem = {
      id: newId,
      title: `${draft.title} (Copy)`,
      content: draft.content,
      updatedAt: new Date().toISOString(),
    };
    setDrafts((prev) => [copy, ...prev]);
    setActiveDraftId(newId);
    toast.success("Duplicated draft");
  };

  return (
    <div className="dashboard-layout pb-24" style={{ maxWidth: "100%", width: "100%", marginTop: 36 }}>
      {/* ── Page Header / Sub-navigation ── */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDraftsDrawer(!showDraftsDrawer)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "var(--surface-container)",
              color: "var(--ink)",
              border: "1px solid var(--hairline)",
            }}
            title="Manage saved drafts"
          >
            <FolderOpen size={14} style={{ color: "var(--brass)" }} />
            <span>My Drafts ({drafts.length})</span>
            <ChevronRight size={13} className={`transition-transform ${showDraftsDrawer ? "rotate-90" : ""}`} />
          </button>

          <button
            onClick={handleCreateNewDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "var(--brass-soft)",
              color: "var(--brass-bright)",
              border: "1px solid var(--hairline)",
            }}
          >
            <Plus size={14} />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* ── Saved Drafts Drawer / Selector ── */}
      {showDraftsDrawer && (
        <div
          className="p-4 rounded-xl border mb-6 space-y-3 shadow-sm"
          style={{
            background: "var(--surface)",
            borderColor: "var(--hairline)",
          }}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/40">
            <span className="font-mono uppercase tracking-wider text-[11px]">Saved Legal Pleadings & Petitions</span>
            <button
              onClick={handleCreateNewDraft}
              className="text-primary hover:underline flex items-center gap-1 text-xs font-medium"
            >
              <Plus size={12} /> New Blank Document
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {drafts.map((d) => {
              const isActive = d.id === activeDraftId;
              return (
                <div
                  key={d.id}
                  onClick={() => {
                    setActiveDraftId(d.id);
                    setShowDraftsDrawer(false);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isActive ? "ring-1 ring-primary" : "hover:border-border"
                  }`}
                  style={{
                    background: isActive ? "var(--brass-soft)" : "var(--surface-container)",
                    borderColor: isActive ? "var(--brass)" : "var(--hairline-soft)",
                  }}
                >
                  <div className="space-y-1 min-w-0">
                    <span
                      className="text-xs font-semibold line-clamp-1 block"
                      style={{ color: "var(--ink)" }}
                    >
                      {d.title}
                    </span>
                    <span
                      className="text-[10px] text-muted-foreground font-mono flex items-center gap-1"
                    >
                      <Clock size={10} />
                      {new Date(d.updatedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/20">
                    <button
                      onClick={(e) => handleDuplicateDraft(d, e)}
                      className="p-1 rounded hover:bg-muted/50 text-muted-foreground transition-colors"
                      title="Duplicate draft"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteDraft(d.id, e)}
                      className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main Legal Word Processor ── */}
      {activeDraft && (
        <LegalEditor
          key={activeDraft.id}
          initialContent={activeDraft.content}
          documentTitle={activeDraft.title}
          onTitleChange={handleTitleChange}
          onSave={handleContentSave}
          lastSavedAt={lastSavedAt}
          isFullscreen={isFullscreen}
          onFullscreenChange={setIsFullscreen}
        />
      )}

      {/* ── Floating Legal AI Drafting Chatbot ── */}
      <DocumentChatDrawer
        documentTitle={activeDraft?.title}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}
