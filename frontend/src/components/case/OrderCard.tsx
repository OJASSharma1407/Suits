import React from "react";
import { FileText, Download, Sparkles, AlertCircle } from "lucide-react";
import type { OrderItem } from "@/types/case";

interface OrderCardProps {
  cnr: string;
  order: OrderItem;
  onOpenAI: (filename: string) => void;
  onDownloadPDF: (filename: string) => void;
}

export function OrderCard({ cnr, order, onOpenAI, onDownloadPDF }: OrderCardProps) {
  // If date is "0000-00-00", show it as N/A instead of invalid date string
  const displayDate = order.order_date && !order.order_date.startsWith("0000") ? order.order_date : "Date Unavailable";

  return (
    <div className="card-float p-5 group flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[var(--border-strong)]">
      <div className="flex items-center gap-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
          style={{
            background: order.is_stub ? "var(--surface-container)" : "var(--surface-container)",
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
            {order.filename && (
              <button
                onClick={() => order.filename && onOpenAI(order.filename)}
                className="btn-ghost flex items-center gap-1.5"
                style={{ color: "var(--primary)" }}
              >
                <Sparkles size={14} /> <span className="hidden sm:inline">AI Summary</span>
              </button>
            )}
            <button
              onClick={() => order.filename && onDownloadPDF(order.filename)}
              className="btn-ghost flex items-center gap-1.5"
              disabled={!order.filename}
            >
              <Download size={14} /> <span className="hidden sm:inline">PDF</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
