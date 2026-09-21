import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Printer,
  Download,
  Copy,
  Check,
  RotateCcw,
  RotateCw,
  FileText,
  Sparkles,
  ChevronDown,
  Scale,
  Type,
  Maximize2,
  Minimize2,
  Trash2,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface LegalEditorProps {
  initialContent?: string;
  documentTitle: string;
  onTitleChange: (newTitle: string) => void;
  onSave?: (content: string) => void;
  lastSavedAt?: Date | null;
  isFullscreen?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const FONTS = [
  { id: "'Bookman Old Style', Georgia, serif", label: "Bookman Old Style", court: "Court Mandatory" },
  { id: "'Times New Roman', Times, serif", label: "Times New Roman", court: "District / HC" },
  { id: "'Source Serif 4', Georgia, serif", label: "Source Serif", court: "Modern" },
  { id: "'Courier New', Courier, monospace", label: "Courier", court: "Pleading Typewriter" },
  { id: "'IBM Plex Sans', sans-serif", label: "IBM Plex Sans", court: "Clean Sans" },
];

const FONT_SIZES = [
  { value: "12pt", label: "12 pt" },
  { value: "13pt", label: "13 pt" },
  { value: "14pt", label: "14 pt (Court Std)" },
  { value: "16pt", label: "16 pt (Heading)" },
  { value: "18pt", label: "18 pt (Title)" },
];

const LINE_SPACINGS = [
  { value: "1.0", label: "1.0 (Single)" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5 (Standard Court)" },
  { value: "1.6", label: "1.6 (HC Filing)" },
  { value: "2.0", label: "2.0 (Double)" },
];

const PAPER_THEMES = [
  { id: "cream", label: "Cream Court Paper", bg: "#FBF9F1", text: "#1A1915", line: "#D8D4C7" },
  { id: "white", label: "Standard Pure White", bg: "#FFFFFF", text: "#111827", line: "#E5E7EB" },
  { id: "warm", label: "Warm Parchment", bg: "#F5EFEB", text: "#221E1B", line: "#DED6CF" },
  { id: "dark", label: "Dark Preview", bg: "#1E222B", text: "#F3F1EA", line: "rgba(255, 255, 255, 0.12)" },
];

export const LegalEditor: React.FC<LegalEditorProps> = ({
  initialContent = "",
  documentTitle,
  onTitleChange,
  onSave,
  lastSavedAt,
  isFullscreen: controlledFullscreen,
  onFullscreenChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedFont, setSelectedFont] = useState(FONTS[0].id);
  const [selectedSize, setSelectedSize] = useState("14pt");
  const [selectedSpacing, setSelectedSpacing] = useState("1.5");
  const [selectedTheme, setSelectedTheme] = useState(PAPER_THEMES[0].id);

  // Helper to parse content into discrete pages
  const parsePagesFromContent = (html: string): string[] => {
    if (!html || !html.trim()) return ["<p><br></p>"];
    // Split by court page break markers
    const parts = html.split(/<div[^>]*class="[^"]*court-page-break[^"]*"[^>]*>.*?<\/div>/gi);
    if (parts.length > 1) {
      return parts.map((p) => p.trim() || "<p><br></p>");
    }
    return [html];
  };

  const [pages, setPages] = useState<string[]>(() => parsePagesFromContent(initialContent));
  const [activePageIndex, setActivePageIndex] = useState(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  // Custom Dropdown states
  const [showInserts, setShowInserts] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showSpacingMenu, setShowSpacingMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isFullscreen = controlledFullscreen !== undefined ? controlledFullscreen : internalFullscreen;
  const setIsFullscreen = (val: boolean) => {
    setInternalFullscreen(val);
    onFullscreenChange?.(val);
  };

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(documentTitle);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".editor-dropdown-container")) {
        setShowInserts(false);
        setShowFontMenu(false);
        setShowSizeMenu(false);
        setShowSpacingMenu(false);
        setShowThemeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle ESC key to exit fullscreen & Ctrl+Enter for new page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleAddNewPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, pages.length]);

  // Lock body scroll in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // Initialize and synchronize content into pageRefs
  useEffect(() => {
    pages.forEach((html, i) => {
      const el = pageRefs.current[i];
      if (el && el.innerHTML !== html) {
        el.innerHTML = html;
      }
    });
    updateMetrics();
  }, [pages.length]);

  useEffect(() => {
    setTitleInput(documentTitle);
  }, [documentTitle]);

  const updateMetrics = useCallback(() => {
    let totalWords = 0;
    let totalChars = 0;
    const currentPagesHtml: string[] = [];

    pages.forEach((_, i) => {
      const el = pageRefs.current[i];
      if (el) {
        const text = el.innerText || "";
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        totalWords += words;
        totalChars += text.length;
        currentPagesHtml.push(el.innerHTML);
      } else {
        currentPagesHtml.push(pages[i] || "");
      }
    });

    setWordCount(totalWords);
    setCharCount(totalChars);

    if (onSave) {
      const combined = currentPagesHtml.join(
        '<div class="court-page-break" style="page-break-after: always; margin: 36px 0;"></div>'
      );
      onSave(combined);
    }
  }, [pages, onSave]);

  const handlePageInput = (index: number) => {
    const el = pageRefs.current[index];
    if (!el) return;
    const newHtml = el.innerHTML;
    setPages((prev) => {
      const next = [...prev];
      next[index] = newHtml;
      return next;
    });
    updateMetrics();

    // Automatic page addition: if the user reaches capacity on the last page (~950px content height)
    if (el.scrollHeight > 950 && index === pages.length - 1) {
      handleAddNewPage();
    }
  };

  const handleAddNewPage = () => {
    setPages((prev) => [...prev, "<p><br></p>"]);
    const nextIndex = pages.length;
    setActivePageIndex(nextIndex);

    setTimeout(() => {
      const newEl = pageRefs.current[nextIndex];
      if (newEl) {
        newEl.focus();
        newEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    toast.success(`Added Court Page ${pages.length + 1}`);
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      toast.error("Cannot delete the only page");
      return;
    }
    if (confirm(`Delete Court Page ${index + 1}?`)) {
      setPages((prev) => prev.filter((_, i) => i !== index));
      const nextActive = Math.max(0, index - 1);
      setActivePageIndex(nextActive);
      toast.info(`Deleted Court Page ${index + 1}`);
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    const targetEl = pageRefs.current[activePageIndex] || pageRefs.current[0];
    if (targetEl) {
      targetEl.focus();
    }
    document.execCommand(command, false, value);
    handlePageInput(activePageIndex);
  };

  // ─── ROBUST BLOCK INSERTION ──────────────────────────────────────────────
  // Inserts a clean, top-level block without breaking or corrupting existing paragraphs
  const insertCourtBlock = (html: string) => {
    const targetEl = pageRefs.current[activePageIndex] || pageRefs.current[0];
    if (!targetEl) return;
    targetEl.focus();

    const selection = window.getSelection();

    // If editor is empty, set directly
    if (!targetEl.innerHTML.trim() || targetEl.innerText.trim() === "") {
      targetEl.innerHTML = html + `<p><br></p>`;
      setShowInserts(false);
      handlePageInput(activePageIndex);
      return;
    }

    if (!selection || selection.rangeCount === 0) {
      // Append to the end
      targetEl.innerHTML += `<div class="court-block-wrapper my-4">${html}</div><p><br></p>`;
      setShowInserts(false);
      handlePageInput(activePageIndex);
      return;
    }

    const range = selection.getRangeAt(0);

    // Find the closest block container inside targetEl
    let node: Node | null = range.startContainer;
    while (node && node.parentNode !== targetEl && node !== targetEl) {
      node = node.parentNode;
    }

    const blockWrapper = document.createElement("div");
    blockWrapper.className = "court-block-wrapper my-4";
    blockWrapper.innerHTML = html;

    const trailingP = document.createElement("p");
    trailingP.innerHTML = "<br>";

    if (node && node !== targetEl && node.parentNode === targetEl) {
      // Insert right after the current top-level block
      if (node.nextSibling) {
        targetEl.insertBefore(blockWrapper, node.nextSibling);
        targetEl.insertBefore(trailingP, blockWrapper.nextSibling);
      } else {
        targetEl.appendChild(blockWrapper);
        targetEl.appendChild(trailingP);
      }
    } else {
      // Append to end of editor
      targetEl.appendChild(blockWrapper);
      targetEl.appendChild(trailingP);
    }

    // Set selection in the trailing paragraph
    const newRange = document.createRange();
    newRange.setStart(trailingP, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    setShowInserts(false);
    handlePageInput(activePageIndex);
  };

  // ─── TYPOGRAPHY CHANGE HANDLERS ──────────────────────────────────────────
  const handleFontChange = (fontId: string) => {
    setSelectedFont(fontId);
    setShowFontMenu(false);
    // If text is selected, apply to selection; otherwise, updates entire sheet
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      exec("fontName", fontId);
    }
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    setShowSizeMenu(false);
    // If text is selected, apply fontSize; otherwise, entire sheet updates
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      exec("fontSize", "4"); // execCommand uses 1-7
    }
  };

  const handleSpacingChange = (spacing: string) => {
    setSelectedSpacing(spacing);
    setShowSpacingMenu(false);
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    setShowThemeMenu(false);
  };

  // ── Indian Court Templates & Quick Inserts ──────────────────────────────
  const insertCauseTitle = () => {
    const html = `
      <div style="text-align: center; font-weight: bold; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 1.15em; letter-spacing: 0.04em;">IN THE HIGH COURT OF DELHI AT NEW DELHI</p>
        <p style="margin: 4px 0 0 0; font-size: 0.9em; font-style: italic; font-weight: normal;">(EXTRAORDINARY ORIGINAL WRIT JURISDICTION)</p>
        <p style="margin: 12px 0 0 0; font-size: 1.05em;">WRIT PETITION (CIVIL) NO. _________ OF 2026</p>
      </div>
      <div style="margin-bottom: 14px;">
        <p style="margin: 0; font-weight: bold;">IN THE MATTER OF:</p>
      </div>
    `;
    insertCourtBlock(html);
  };

  const insertMemoOfParties = () => {
    const html = `
      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="vertical-align: top; width: 75%;">
              <b>[NAME OF PETITIONER / APPLICANT]</b><br/>
              S/o [Father's Name], Aged about [__] Years,<br/>
              Resident of [Complete Address, City, State - PIN]
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
              Through Secretary, Ministry of Home Affairs,<br/>
              North Block, New Delhi - 110001.<br/><br/>
              <b>2. STATE (NCT OF DELHI)</b><br/>
              Through Station House Officer,<br/>
              Police Station [Name], New Delhi.
            </td>
            <td style="vertical-align: bottom; text-align: right; width: 25%;">
              <b>...RESPONDENTS</b>
            </td>
          </tr>
        </table>
      </div>
    `;
    insertCourtBlock(html);
  };

  const insertOpeningClause = () => {
    const html = `
      <div style="text-align: center; margin: 20px 0 14px 0; font-weight: bold; letter-spacing: 0.08em;">
        MOST RESPECTFULLY SHEWETH:
      </div>
      <p style="text-indent: 40px; margin-bottom: 14px; text-align: justify;">
        1. That the Petitioner is a law-abiding citizen of India, residing at the address stated hereinabove, and is approaching this Hon'ble Court seeking urgent intervention.
      </p>
    `;
    insertCourtBlock(html);
  };

  const insertNumberedParagraph = () => {
    const html = `
      <p style="text-indent: 40px; margin-bottom: 14px; text-align: justify;">
        [__]. That the Petitioner respectfully submits that [State facts of the case here with chronological dates and events]...
      </p>
    `;
    insertCourtBlock(html);
  };

  const insertGrounds = () => {
    const html = `
      <div style="text-align: center; margin: 24px 0 16px 0; font-weight: bold; letter-spacing: 0.05em;">
        GROUNDS
      </div>
      <p style="margin-bottom: 12px; text-align: justify;">
        <b>A. FOR THAT</b> the impugned action/order dated [Date] passed by Respondent No. [__] is ex-facie illegal, arbitrary, perverse, and violative of Articles 14, 19, and 21 of the Constitution of India.
      </p>
      <p style="margin-bottom: 12px; text-align: justify;">
        <b>B. FOR THAT</b> the Respondent failed to observe the settled principles of natural justice (audi alteram partem) prior to issuing the impugned directive.
      </p>
      <p style="margin-bottom: 12px; text-align: justify;">
        <b>C. FOR THAT</b> by operation of Section 8 of the General Clauses Act, 1897 and pari materia jurisprudence, the ratio decidendi laid down by the Hon'ble Supreme Court in [Landmark Citation] squarely governs the present adjudication.
      </p>
    `;
    insertCourtBlock(html);
  };

  const insertPrayer = () => {
    const html = `
      <div style="text-align: center; margin: 26px 0 16px 0; font-weight: bold; letter-spacing: 0.05em;">
        PRAYER
      </div>
      <p style="text-align: justify; margin-bottom: 14px;">
        Wherefore, in the light of the facts and circumstances stated hereinabove, it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:
      </p>
      <p style="margin-left: 30px; margin-bottom: 12px; text-align: justify;">
        <b>(a)</b> Issue an appropriate writ, order, or direction in the nature of Certiorari quashing the impugned order dated [Date] issued by Respondent No. [__]; and
      </p>
      <p style="margin-left: 30px; margin-bottom: 12px; text-align: justify;">
        <b>(b)</b> Issue an appropriate writ, order, or direction in the nature of Mandamus directing the Respondents to [Specify Relief]; and
      </p>
      <p style="margin-left: 30px; margin-bottom: 16px; text-align: justify;">
        <b>(c)</b> Pass such other or further order(s) as this Hon'ble Court may deem fit and proper in the facts and circumstances of the case and in the interest of justice.
      </p>
      <div style="text-align: center; margin: 20px 0; font-weight: bold; font-size: 0.95em;">
        AND FOR THIS ACT OF KINDNESS, THE PETITIONER SHALL AS IN DUTY BOUND EVER PRAY.
      </div>
    `;
    insertCourtBlock(html);
  };

  const insertVerification = () => {
    const html = `
      <div style="margin-top: 32px; border-top: 1px solid currentColor; padding-top: 16px;">
        <div style="text-align: center; font-weight: bold; margin-bottom: 14px;">
          VERIFICATION
        </div>
        <p style="text-align: justify; text-indent: 40px; margin-bottom: 24px;">
          Verified at New Delhi on this [______] day of [_____________], 2026 that the contents of paragraphs 1 to [____] of the above petition are true and correct to my personal knowledge derived from the official records maintained in the ordinary course of business, and nothing material has been concealed or falsely stated therefrom.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
          <tr>
            <td style="vertical-align: bottom;">
              Date: [_______________]<br/>
              Place: New Delhi
            </td>
            <td style="vertical-align: bottom; text-align: right;">
              <b>DEPONENT</b>
            </td>
          </tr>
        </table>
      </div>
    `;
    insertCourtBlock(html);
  };

  const insertVakalatnamaSign = () => {
    const html = `
      <div style="margin-top: 32px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: bottom;">
              <b>THROUGH</b><br/><br/>
              <b>[ADVOCATE NAME]</b><br/>
              Advocate for the Petitioner<br/>
              Enrollment No.: D/[______]/20[__]<br/>
              Chamber No. [___], Delhi High Court,<br/>
              Sher Shah Road, New Delhi - 110503<br/>
              Mobile: +91 98[_________]<br/>
              Email: counsel@suits.legal
            </td>
            <td style="vertical-align: bottom; text-align: right;">
              <b>PETITIONER</b>
            </td>
          </tr>
        </table>
      </div>
    `;
    insertCourtBlock(html);
  };

  const insertPageBreak = () => {
    const html = `
      <div class="court-page-break" style="page-break-after: always; border-bottom: 2px dashed rgba(150, 114, 26, 0.4); margin: 36px 0; text-align: center; font-size: 10px; font-family: monospace; color: #888; user-select: none;">
        ——— COURT PAGE BREAK ———
      </div>
    `;
    insertCourtBlock(html);
  };

  // ── Print & Export ──────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDoc = () => {
    const content = pages
      .map((_, i) => pageRefs.current[i]?.innerHTML || pages[i] || "")
      .join('<br clear="all" style="page-break-before:always; mso-break-type:section-break" />');
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${documentTitle}</title>
        <style>
          @page {
            size: A4;
            margin: 1.0in;
            mso-header-margin: 0.5in;
            mso-footer-margin: 0.5in;
          }
          body {
            font-family: 'Bookman Old Style', 'Times New Roman', serif;
            font-size: ${selectedSize};
            line-height: ${selectedSpacing};
            text-align: justify;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
    const blob = new Blob(["\ufeff", header], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded court-formatted Word document (.doc)");
  };

  const handleCopyText = () => {
    const fullText = pages
      .map((_, i) => pageRefs.current[i]?.innerText || "")
      .filter(Boolean)
      .join("\n\n——— COURT PAGE BREAK ———\n\n");
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    toast.success("Pleading text copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the editor?")) {
      setPages(["<p><br></p>"]);
      if (pageRefs.current[0]) {
        pageRefs.current[0].innerHTML = "<p><br></p>";
      }
      setActivePageIndex(0);
      toast.info("Editor cleared");
    }
  };

  const activeTheme = PAPER_THEMES.find((t) => t.id === selectedTheme) || PAPER_THEMES[0];

  return (
    <div
      ref={containerRef}
      className={`flex flex-col ${
        isFullscreen
          ? "fixed inset-0 h-screen w-screen overflow-hidden z-[9990] p-4 sm:p-6 gap-3"
          : "space-y-4"
      }`}
      style={
        isFullscreen
          ? {
              backgroundColor: "var(--bg)",
              zIndex: 9990,
            }
          : undefined
      }
    >
      {/* ── Top Bar: Title & Metadata ── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "var(--brass-soft)",
              color: "var(--brass-bright)",
              border: "1px solid var(--hairline)",
            }}
          >
            <FileText size={18} />
          </div>

          <div className="space-y-0.5">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false);
                  onTitleChange(titleInput || "Untitled Legal Pleading");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingTitle(false);
                    onTitleChange(titleInput || "Untitled Legal Pleading");
                  }
                }}
                autoFocus
                className="text-lg font-medium bg-transparent border-b border-primary px-1 outline-none"
                style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-lg font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
                style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
                title="Click to rename document"
              >
                <span>{documentTitle}</span>
                <span className="text-xs font-normal text-muted-foreground opacity-60">✎</span>
              </h2>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono">
                <CheckCircle2 size={12} className="text-emerald-500" />
                {lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString()}` : "Auto-saving"}
              </span>
              <span>•</span>
              <span className="font-mono">{wordCount} words</span>
              <span>•</span>
              <span className="font-mono">{charCount} chars</span>
              <span>•</span>
              <span className="font-mono">
                ~{pages.length} {pages.length === 1 ? "Court Page" : "Court Pages"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCopyText}
            className="btn btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 cursor-pointer"
            title="Copy plain text"
          >
            {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{isCopied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleDownloadDoc}
            className="btn btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 cursor-pointer"
            title="Download formatted court .doc file"
          >
            <Download size={13} style={{ color: "var(--brass)" }} />
            <span>Export DOC</span>
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handlePrint}
            className="btn btn-primary text-xs flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg cursor-pointer"
            style={{
              background: "var(--brass)",
              color: "var(--on-primary)",
            }}
            title="Court-ready PDF print with exact margins"
          >
            <Printer size={13} />
            <span>Court Print / PDF</span>
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              isFullscreen
                ? "bg-primary/20 text-primary border border-primary/40"
                : "border border-border/50 hover:bg-muted/50 text-muted-foreground"
            }`}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Editor"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={13} />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 size={13} />
                <span>Fullscreen</span>
              </>
            )}
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
            title="Clear Editor"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── Secondary Toolbar: Indian Court Inserts & Typography Controls ── */}
      <div
        className="shrink-0 p-2.5 rounded-xl border flex items-center justify-between gap-3 flex-wrap text-xs shadow-xs"
        style={{
          background: "var(--surface)",
          borderColor: "var(--hairline)",
        }}
      >
        {/* Formatting Tools */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Add Page Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleAddNewPage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer hover:opacity-90 active:scale-95"
            style={{
              background: "var(--brass-soft)",
              color: "var(--brass-bright)",
              border: "1px solid var(--hairline)",
            }}
            title="Add a new blank court page"
          >
            <Plus size={13} />
            <span>Add Page</span>
          </button>

          {/* Indian Legal Quick Inserts Dropdown */}
          <div className="relative editor-dropdown-container">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowInserts(!showInserts)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer"
              style={{
                background: "var(--brass-soft)",
                color: "var(--brass-bright)",
                border: "1px solid var(--hairline)",
              }}
            >
              <Scale size={13} />
              <span>Indian Court Formats</span>
              <ChevronDown size={12} className={`transition-transform ${showInserts ? "rotate-180" : ""}`} />
            </button>

            {showInserts && (
              <div
                className="absolute left-0 top-full mt-1.5 w-72 rounded-xl border shadow-xl p-1.5 z-40 space-y-1"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--hairline)",
                }}
              >
                <div className="px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick-Insert Court Sections
                </div>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertCauseTitle}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted/50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Type size={12} style={{ color: "var(--brass)" }} />
                  <span>Cause Title / Court Header</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertMemoOfParties}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted/50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileText size={12} style={{ color: "var(--brass)" }} />
                  <span>Memo of Parties (Petitioner vs Resp)</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertOpeningClause}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted/50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Sparkles size={12} style={{ color: "var(--brass)" }} />
                  <span>"Most Respectfully Sheweth"</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertNumberedParagraph}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted/50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <ListOrdered size={12} style={{ color: "var(--brass)" }} />
                  <span>Numbered Facts Paragraph</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertGrounds}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted/50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Scale size={12} style={{ color: "var(--brass)" }} />
                  <span>Grounds of Challenge (FOR THAT...)</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertPrayer}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted/50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Sparkles size={12} style={{ color: "var(--brass)" }} />
                  <span>Prayer Clause & Kindness</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertVerification}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted/50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <CheckCircle2 size={12} style={{ color: "var(--brass)" }} />
                  <span>Sworn Verification Clause</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertVakalatnamaSign}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted/50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileText size={12} style={{ color: "var(--brass)" }} />
                  <span>Counsel Identification / Vakalatnama</span>
                </button>
                <div className="border-t border-border/30 my-1" />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertPageBreak}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted/50 flex items-center gap-2 cursor-pointer transition-colors text-amber-600 dark:text-amber-400"
                >
                  <Scissors size={12} />
                  <span>Insert Court Page Break</span>
                </button>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-border/40 mx-1" />

          {/* Text Style buttons with onMouseDown preventDefault */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("bold")}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Bold (Ctrl+B)"
          >
            <Bold size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("italic")}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Italic (Ctrl+I)"
          >
            <Italic size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("underline")}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Underline (Ctrl+U)"
          >
            <Underline size={14} />
          </button>

          <div className="h-5 w-px bg-border/40 mx-1" />

          {/* Alignment */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("justifyFull")}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Justify (Indian Court Standard)"
          >
            <AlignJustify size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("justifyLeft")}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Align Left"
          >
            <AlignLeft size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("justifyCenter")}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Align Center (Cause Title)"
          >
            <AlignCenter size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("justifyRight")}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Align Right (Date / Place / Counsel)"
          >
            <AlignRight size={14} />
          </button>

          <div className="h-5 w-px bg-border/40 mx-1" />

          {/* Lists */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("insertOrderedList")}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Numbered List (Paragraphs)"
          >
            <ListOrdered size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("insertUnorderedList")}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Bullet List"
          >
            <List size={14} />
          </button>

          <div className="h-5 w-px bg-border/40 mx-1" />

          {/* Undo / Redo */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("undo")}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("redo")}
            className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw size={14} />
          </button>
        </div>

        {/* ── Custom Styled Typography & Court Controls ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Custom Font Family Menu */}
          <div className="relative editor-dropdown-container">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setShowFontMenu(!showFontMenu);
                setShowSizeMenu(false);
                setShowSpacingMenu(false);
                setShowThemeMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs cursor-pointer transition-all"
              style={{
                background: "var(--surface-container)",
                borderColor: "var(--hairline)",
                color: "var(--ink)",
              }}
            >
              <span className="font-medium">
                {FONTS.find((f) => f.id === selectedFont)?.label || "Font"}
              </span>
              <ChevronDown size={11} className="opacity-60" />
            </button>

            {showFontMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-56 rounded-xl border shadow-xl p-1 z-40 space-y-0.5"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--hairline)",
                }}
              >
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleFontChange(f.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      selectedFont === f.id ? "bg-primary/15 text-primary font-semibold" : "hover:bg-muted/50"
                    }`}
                    style={{ fontFamily: f.id }}
                  >
                    <span>{f.label}</span>
                    <span className="text-[10px] opacity-60 font-mono">{f.court}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Font Size Menu */}
          <div className="relative editor-dropdown-container">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setShowSizeMenu(!showSizeMenu);
                setShowFontMenu(false);
                setShowSpacingMenu(false);
                setShowThemeMenu(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs cursor-pointer transition-all"
              style={{
                background: "var(--surface-container)",
                borderColor: "var(--hairline)",
                color: "var(--ink)",
              }}
            >
              <span className="font-mono">{selectedSize}</span>
              <ChevronDown size={11} className="opacity-60" />
            </button>

            {showSizeMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-xl p-1 z-40 space-y-0.5"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--hairline)",
                }}
              >
                {FONT_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSizeChange(s.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      selectedSize === s.value ? "bg-primary/15 text-primary font-semibold" : "hover:bg-muted/50"
                    }`}
                  >
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Line Spacing Menu */}
          <div className="relative editor-dropdown-container">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setShowSpacingMenu(!showSpacingMenu);
                setShowFontMenu(false);
                setShowSizeMenu(false);
                setShowThemeMenu(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs cursor-pointer transition-all"
              style={{
                background: "var(--surface-container)",
                borderColor: "var(--hairline)",
                color: "var(--ink)",
              }}
            >
              <span className="font-mono">{selectedSpacing}x</span>
              <ChevronDown size={11} className="opacity-60" />
            </button>

            {showSpacingMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-xl p-1 z-40 space-y-0.5"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--hairline)",
                }}
              >
                {LINE_SPACINGS.map((l) => (
                  <button
                    key={l.value}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSpacingChange(l.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      selectedSpacing === l.value ? "bg-primary/15 text-primary font-semibold" : "hover:bg-muted/50"
                    }`}
                  >
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Paper Style Menu */}
          <div className="relative editor-dropdown-container">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setShowThemeMenu(!showThemeMenu);
                setShowFontMenu(false);
                setShowSizeMenu(false);
                setShowSpacingMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs cursor-pointer transition-all"
              style={{
                background: "var(--surface-container)",
                borderColor: "var(--hairline)",
                color: "var(--ink)",
              }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: activeTheme.bg }}
              />
              <span>{activeTheme.label.split(" ")[0]}</span>
              <ChevronDown size={11} className="opacity-60" />
            </button>

            {showThemeMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-xl p-1 z-40 space-y-0.5"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--hairline)",
                }}
              >
                {PAPER_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleThemeChange(t.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                      selectedTheme === t.id ? "bg-primary/15 text-primary font-semibold" : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: t.bg }}
                    />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Document Canvas: Physical Legal Pages (Word-like Gap Layout) ── */}
      <div
        className={`flex flex-col items-center p-4 sm:p-8 bg-muted/25 rounded-2xl border border-border/40 overflow-x-auto ${
          isFullscreen
            ? "flex-1 min-h-0 overflow-y-auto"
            : "min-h-[850px]"
        }`}
      >
        <div className="flex flex-col items-center gap-8 py-4 w-full max-w-[816px]">
          {pages.map((pageHtml, index) => (
            <div
              key={index}
              className="legal-document-sheet relative shadow-2xl transition-all"
              style={{
                width: "816px",
                minHeight: "1120px",
                backgroundColor: activeTheme.bg,
                color: activeTheme.text,
                fontFamily: selectedFont,
                fontSize: selectedSize,
                lineHeight: selectedSpacing,
                paddingTop: "1.0in",
                paddingBottom: "1.0in",
                paddingLeft: "1.0in",
                paddingRight: "1.0in",
                borderRadius: "4px",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)",
                position: "relative",
              }}
              onClick={() => setActivePageIndex(index)}
            >
              {/* Page Header (Page N of Total & Delete Option) */}
              <div className="legal-page-header absolute top-4 right-8 text-[10px] font-mono opacity-40 select-none flex items-center gap-2">
                <span>Page {index + 1} of {pages.length}</span>
                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePage(index);
                    }}
                    className="p-1 rounded hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-colors cursor-pointer"
                    title={`Delete Page ${index + 1}`}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>

              {/* Page Footer (— N —) */}
              <div className="legal-page-footer absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-40 select-none">
                — {index + 1} —
              </div>

              {/* Editable Content Canvas for this Page */}
              <div
                ref={(el) => (pageRefs.current[index] = el)}
                contentEditable
                onFocus={() => setActivePageIndex(index)}
                onInput={() => handlePageInput(index)}
                className="legal-editor-content outline-none min-h-[928px]"
                style={{
                  textAlign: "justify",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  lineHeight: "inherit",
                }}
                placeholder={
                  index === 0
                    ? "Start drafting your petition or pleading here... Use 'Indian Court Formats' above to insert Cause Title, Memo of Parties, Grounds, and Prayer."
                    : `Continue drafting Court Page ${index + 1}...`
                }
              />
            </div>
          ))}

          {/* "+ Add New Court Page" Button Between / Below Pages */}
          <button
            type="button"
            onClick={handleAddNewPage}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer my-4 group"
            style={{
              background: "var(--surface)",
              color: "var(--brass)",
              border: "1px dashed var(--brass)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
            title="Add a new blank court page (Ctrl+Enter)"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
            <span>Add New Court Page (Page {pages.length + 1})</span>
            <span className="text-[10px] opacity-60 font-mono ml-1 border px-1.5 py-0.5 rounded">Ctrl+Enter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
