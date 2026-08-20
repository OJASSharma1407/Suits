import React from "react";
import { FileText, Download, Sparkles, AlertCircle, BookOpen } from "lucide-react";
import type { OrderItem } from "@/types/case";

interface OrderCardProps {
  cnr: string;
  order: OrderItem;
  onOpenAI: (filename: string) => void;
  onDownloadPDF: (filename: string) => void;
  onReadOrder?: (filename: string, initialTab?: "pdf" | "text") => void;
}

export function OrderCard({ cnr, order, onOpenAI, onDownloadPDF, onReadOrder }: OrderCardProps) {
  // If date is "0000-00-00", show it as N/A instead of invalid date string
  const displayDate = order.order_date && !order.order_date.startsWith("0000") ? order.order_date : "Date Unavailable";

  return (
    <div className="card-float p-5 group flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[var(--border-strong)]">
      <div className="flex items-center gap-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
          style={{
            background: "var(--surface-container)",
            color: order.is_stub ? "var(--text-muted)" : "var(--text-primary)",
          }}
        >
          <FileText size={18} />
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
            {displayDate}
          </h4>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {order.description || order.filename}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {order.is_stub ? (
          <span
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full"
            style={{ background: "var(--surface-container)", color: "var(--text-muted)" }}
          >
            <AlertCircle size={12} />
            Document not available
          </span>
        ) : (
          <>
            {/* Primary Action: In-Built Document Reader */}
            {order.filename && onReadOrder && (
              <button
                onClick={() => order.filename && onReadOrder(order.filename, "pdf")}
                className="btn-ghost flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                style={{
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-button)",
                  padding: "7px 14px",
                }}
                title="Read court document inside SUITS"
              >
                <BookOpen size={14} style={{ color: "var(--primary)" }} />
                <span>Read Order</span>
              </button>
            )}

            {order.filename && (
              <button
                onClick={() => order.filename && onOpenAI(order.filename)}
                className="btn-ghost flex items-center gap-1.5 cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
                title="View Case Summary"
              >
                <Sparkles size={14} /> <span className="hidden sm:inline">Summary</span>
              </button>
            )}
            
            <button
              onClick={() => order.filename && onDownloadPDF(order.filename)}
              className="btn-ghost flex items-center gap-1.5 cursor-pointer"
              disabled={!order.filename}
              title="Download Original PDF"
            >
              <Download size={14} /> <span className="hidden sm:inline">PDF</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
