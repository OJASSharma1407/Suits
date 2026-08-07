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
    <div className="w-72 flex flex-col h-full border-r bg-white" style={{ borderColor: "var(--border)" }}>
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={onNew}
          className="btn-primary w-full justify-center"
        >
          <Plus size={16} /> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-center text-xs p-4" style={{ color: "var(--text-muted)" }}>
            No recent conversations.
          </p>
        ) : (
          conversations.map((c) => (
            <div
              key={c.id}
              className="group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors"
              style={{
                background: activeId === c.id ? "var(--surface-container)" : "transparent",
              }}
              onClick={() => onSelect(c.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} style={{ color: activeId === c.id ? "var(--primary)" : "var(--text-muted)" }} flex-shrink-0 />
                <div className="truncate">
                  <p className="text-sm font-medium truncate" style={{ color: activeId === c.id ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {c.title}
                  </p>
                  <p className="text-[10px] font-mono truncate" style={{ color: "var(--text-muted)" }}>
                    {c.cnr}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-200 transition-all text-red-500"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
