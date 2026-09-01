import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FolderArchive,
  Search,
  BookOpen,
  Trash2,
  Printer,
  Scale,
  Hash,
  Sparkles,
  Tag,
  Highlighter,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { fileService } from "@/services/files";
import { chatService } from "@/services/chat";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { DocumentReaderModal } from "@/components/case/DocumentReaderModal";
import { ResearchBriefModal } from "@/components/files/ResearchBriefModal";
import type { SavedFile } from "@/types/file";
import type { ChatMessage } from "@/types/chat";
import { toast } from "sonner";

export default function FilesPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Reader Modal State (to open directly from Files page)
  const [readerFile, setReaderFile] = useState<SavedFile | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // Research Brief Modal State
  const [briefFile, setBriefFile] = useState<SavedFile | null>(null);
  const [isBriefOpen, setIsBriefOpen] = useState(false);

  // AI Assistant Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const streamAbortRef = useRef<AbortController | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await fileService.list();
      setFiles(data.items || []);
    } catch {
      toast.error("Failed to load saved files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const loadChatForCase = async (caseCnr: string) => {
    const localKey = `suits_chat_${caseCnr}`;
    let cachedMessages: ChatMessage[] = [];

    if (localStorage.getItem(localKey)) {
      try {
        const parsed = JSON.parse(localStorage.getItem(localKey)!);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          cachedMessages = parsed.messages;
        }
      } catch {
        // ignore parsing error
      }
    }

    try {
      const convos = await chatService.getConversations();
      const matched = convos.find((c) => c.cnr === caseCnr || c.title?.includes(caseCnr));
      if (matched) {
        setConversationId(matched.id);
        const remoteMsgs = await chatService.getMessages(matched.id);
        if (remoteMsgs && remoteMsgs.length > 0) {
          setMessages(remoteMsgs);
          localStorage.setItem(localKey, JSON.stringify({ conversationId: matched.id, messages: remoteMsgs }));
        } else if (cachedMessages.length > 0) {
          setMessages(cachedMessages);
        }
      } else {
        localStorage.removeItem(localKey);
        setConversationId(null);
        if (cachedMessages.length > 0) {
          setMessages(cachedMessages);
        }
      }
    } catch {
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
      }
    }
  };

  const handleClearChat = async () => {
    streamAbortRef.current?.abort();
    setStreamingContent("");
    setSuggestedQuestions([]);
    setMessages([]);
    if (readerFile?.cnr) {
      localStorage.removeItem(`suits_chat_${readerFile.cnr}`);
      try {
        const convo = await chatService.createConversation(readerFile.cnr, `Case - ${readerFile.cnr}`);
        setConversationId(convo.id);
        toast.success("New chat session started.");
      } catch {
        setConversationId(null);
      }
    } else {
      setConversationId(null);
    }
  };

  const handleExpandChat = async () => {
    setIsChatOpen(false);
    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    } else if (readerFile?.cnr) {
      try {
        const convo = await chatService.createConversation(readerFile.cnr, `Case - ${readerFile.cnr}`);
        setConversationId(convo.id);
        navigate(`/chat/${convo.id}`);
      } catch {
        navigate("/chat");
      }
    } else {
      navigate("/chat");
    }
  };

  const handleSendMessage = async (msg: string) => {
    if (!readerFile?.cnr) return;

    streamAbortRef.current?.abort();
    setStreamingContent("");
    setSuggestedQuestions([]);
    setChatLoading(true);

    try {
      let activeConvoId = conversationId;
      if (!activeConvoId) {
        const convo = await chatService.createConversation(readerFile.cnr, `Case - ${readerFile.cnr}`);
        activeConvoId = convo.id;
        setConversationId(activeConvoId);
      }

      const userMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        message: msg,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const convoId = activeConvoId;
      let accumulatedAnswer = "";
      const controller = chatService.streamMessage(
        convoId,
        msg,
        (token: string) => {
          accumulatedAnswer += token;
          setStreamingContent(accumulatedAnswer);
        },
        (questions: string[]) => {
          const assistantMsg: ChatMessage = {
            id: `server-${Date.now()}`,
            role: "assistant",
            message: accumulatedAnswer,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent("");
          setSuggestedQuestions(questions || []);
          setChatLoading(false);
        },
        (err: string) => {
          if (err !== "AbortError") {
            toast.error(err || "Error receiving AI response.");
          }
          setStreamingContent("");
          setChatLoading(false);
        }
      );
      streamAbortRef.current = controller;
    } catch {
      toast.error("Failed to send message.");
      setChatLoading(false);
    }
  };

  const handleDelete = async (fileId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fileService.delete(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File removed from vault.");
    } catch {
      toast.error("Failed to remove file.");
    }
  };

  // Collect all unique tags across saved files
  const allTags = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => {
      f.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [files]);

  // Filter files by search query and active tag
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesTag = selectedTag === "all" || (f.tags && f.tags.includes(selectedTag));
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        f.case_title.toLowerCase().includes(q) ||
        f.cnr.toLowerCase().includes(q) ||
        f.court_name.toLowerCase().includes(q) ||
        (f.notes && f.notes.toLowerCase().includes(q)) ||
        (f.highlights && f.highlights.some((h) => h.text.toLowerCase().includes(q)));

      return matchesTag && matchesSearch;
    });
  }, [files, searchQuery, selectedTag]);

  const handleOpenReader = (f: SavedFile) => {
    setReaderFile(f);
    loadChatForCase(f.cnr);
    setIsReaderOpen(true);
  };

  const handleOpenBrief = (f: SavedFile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBriefFile(f);
    setIsBriefOpen(true);
  };

  return (
    <div className="dashboard-layout" style={{ maxWidth: "100%", width: "100%", marginTop: 36 }}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-2xl font-medium tracking-tight"
            style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}
          >
            Files & Research Vault
          </h1>
          <p className="text-xs text-muted mt-1">
            Saved court orders, trial strategy notes, and highlighted case citations.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files, notes, or citations…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[var(--brass)] transition-all"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--ink)",
            }}
          />
        </div>
      </div>

      {/* Tag Filtering Bar */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-4 select-none">
          <span className="text-[11px] font-mono text-muted mr-1 flex items-center gap-1">
            <Hash size={12} /> Tags:
          </span>
          <button
            onClick={() => setSelectedTag("all")}
            className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
              selectedTag === "all"
                ? "bg-[var(--brass)] text-[var(--on-primary)] shadow-sm"
                : "border hover:bg-[var(--surface-container)] text-muted"
            }`}
            style={{
              borderColor: selectedTag === "all" ? "var(--brass)" : "var(--border)",
            }}
          >
            All ({files.length})
          </button>

          {allTags.map((tag) => {
            const count = files.filter((f) => f.tags && f.tags.includes(tag)).length;
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? "all" : tag)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? "bg-[var(--brass)] text-[var(--on-primary)] shadow-sm"
                    : "border hover:bg-[var(--surface-container)] text-muted"
                }`}
                style={{
                  borderColor: isSelected ? "var(--brass)" : "var(--border)",
                }}
              >
                <span>#{tag}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Files Content */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonLoader count={1} height="120px" />
          <SkeletonLoader count={3} height="160px" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <EmptyState
          icon={<FolderArchive size={28} />}
          title={searchQuery || selectedTag !== "all" ? "No Matching Saved Files" : "Your Files Vault is Empty"}
          description={
            searchQuery || selectedTag !== "all"
              ? "Try adjusting your search terms or filter tag to find saved orders."
              : undefined
          }
          action={
            searchQuery || selectedTag !== "all" ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTag("all");
                }}
                className="btn btn-primary text-xs px-4 py-2 rounded-xl"
              >
                Clear Filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => handleOpenReader(file)}
              className="card-hover p-5 rounded-2xl border flex flex-col justify-between cursor-pointer group relative transition-all"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="space-y-3">
                {/* Card Top: Court & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-medium"
                    style={{
                      background: "var(--surface-container)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <Scale size={11} />
                    <span className="truncate max-w-[140px]">{file.court_name}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenBrief(file, e)}
                      title="Export Case Research Brief"
                      className="p-1.5 rounded-lg hover:bg-[var(--surface-container)] text-muted hover:text-[var(--brass)] transition-colors cursor-pointer"
                    >
                      <Printer size={13} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(file.id, e)}
                      title="Remove from Vault"
                      className="p-1.5 rounded-lg hover:bg-[var(--surface-container)] text-muted hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Case Title */}
                <div>
                  <h3
                    className="text-sm font-semibold group-hover:text-[var(--brass)] transition-colors line-clamp-2 leading-snug"
                    style={{ color: "var(--ink)" }}
                  >
                    {file.case_title}
                  </h3>
                  <p className="text-[11px] font-mono text-muted mt-1">
                    CNR: {file.cnr} • Order: {file.order_date}
                  </p>
                </div>

                {/* Notes Snippet */}
                {file.notes ? (
                  <div
                    className="p-2.5 rounded-xl border text-xs leading-relaxed line-clamp-3 italic"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      color: "var(--ink-dim)",
                    }}
                  >
                    "{file.notes}"
                  </div>
                ) : (
                  <p className="text-[11px] text-muted italic">No trial notes written yet.</p>
                )}

                {/* Highlights Count & Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {file.highlights && file.highlights.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold"
                      style={{
                        background: "rgba(245, 158, 11, 0.12)",
                        color: "#D97706",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      <Highlighter size={10} />
                      <span>{file.highlights.length} {file.highlights.length === 1 ? "Highlight" : "Highlights"}</span>
                    </span>
                  )}

                  {file.tags?.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10.5px] font-mono"
                      style={{
                        background: "var(--surface-container)",
                        color: "var(--brass)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <Tag size={9} />
                      <span>#{t}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Quick Actions */}
              <div
                className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-medium"
                style={{ borderColor: "var(--border)" }}
              >
                <Link
                  to={`/cases/${file.cnr}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted hover:text-[var(--brass)] flex items-center gap-1 transition-colors text-[11px]"
                >
                  <span>Case Timeline</span>
                  <ExternalLink size={11} />
                </Link>

                <span className="text-[var(--brass)] font-semibold flex items-center gap-1 text-[11px] group-hover:translate-x-0.5 transition-transform">
                  <span>Open Reader</span>
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-Built Document Reader Modal with Full AI Assistant Chat Integration */}
      {readerFile && (
        <DocumentReaderModal
          isOpen={isReaderOpen}
          onClose={() => {
            setIsReaderOpen(false);
            loadFiles(); // Refresh on close in case notes/highlights were updated
          }}
          cnr={readerFile.cnr}
          filename={readerFile.filename}
          caseTitle={readerFile.case_title}
          courtName={readerFile.court_name}
          orderDate={readerFile.order_date}
          initialMode="pdf"
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          chatMessages={messages}
          onSendMessage={handleSendMessage}
          chatLoading={chatLoading}
          streamingContent={streamingContent}
          suggestedQuestions={suggestedQuestions}
          onClearChat={handleClearChat}
          onExpandChat={handleExpandChat}
        />
      )}

      {/* Case Research Brief Printable Modal */}
      {briefFile && (
        <ResearchBriefModal
          isOpen={isBriefOpen}
          onClose={() => setIsBriefOpen(false)}
          caseTitle={briefFile.case_title}
          courtName={briefFile.court_name}
          orderDate={briefFile.order_date}
          cnr={briefFile.cnr}
          notes={briefFile.notes}
          highlights={briefFile.highlights || []}
          tags={briefFile.tags || []}
        />
      )}
    </div>
  );
}
