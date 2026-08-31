import React from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import type { Conversation } from "@/types/chat";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: ConversationSidebarProps) {
  return (
    <div
      className="w-72 flex flex-col h-full border-r overflow-hidden"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="p-3.5 border-b" style={{ borderColor: "var(--border)" }}>
        <button
          type="button"
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer shadow-xs hover:opacity-95 active:scale-[0.98]"
          style={{
            background: "var(--brass)",
            color: "var(--on-primary)",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-center text-xs p-4" style={{ color: "var(--ink-faint)" }}>
            No recent conversations.
          </p>
        ) : (
          conversations.map((c) => {
            const isActive = activeId === c.id;
            const displayTitle = (
              c.title ||
              (c.cnr === "GENERAL" ? "General Legal Research" : `Case - ${c.cnr}`)
            ).replace(/^Chat\s*-\s*/i, "Case - ");
            const displaySub = c.cnr === "GENERAL" ? "Legal Research" : c.cnr;

            return (
              <div
                key={c.id}
                className="group flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all duration-150 border"
                style={{
                  background: isActive ? "var(--surface-container)" : "transparent",
                  borderColor: isActive ? "var(--border)" : "transparent",
                }}
                onClick={() => onSelect(c.id)}
              >
                <div className="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isActive ? "var(--brass-soft)" : "var(--surface-container-high)",
                      color: isActive ? "var(--brass-bright)" : "var(--ink-dim)",
                    }}
                  >
                    <MessageSquare size={14} />
                  </div>
                  <div className="truncate min-w-0 flex-1">
                    <p
                      className="text-xs sm:text-[13px] font-medium truncate"
                      style={{ color: isActive ? "var(--ink)" : "var(--ink-dim)" }}
                    >
                      {displayTitle}
                    </p>
                    <p
                      className="text-[10.5px] font-mono truncate"
                      style={{ color: "var(--ink-faint)" }}
                    >
                      {displaySub}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl transition-all cursor-pointer flex-shrink-0"
                  style={{
                    color: "var(--danger)",
                    background: "transparent",
                  }}
                  title="Delete Conversation"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
