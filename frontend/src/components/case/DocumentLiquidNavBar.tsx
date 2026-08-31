import React, { useState } from "react";
import { BookOpen, Sparkles, Download, Network } from "lucide-react";
import type { OrderItem } from "@/types/case";

export type DocumentTab = "read" | "summary" | "pdf";

interface DocumentLiquidNavBarProps {
  orders: OrderItem[];
  selectedFilename?: string | null;
  onReadOrder: (filename?: string | null) => void;
  onOpenSummary: (filename?: string | null) => void;
  onDownloadPDF: (filename?: string | null) => void;
  aiLoading?: boolean;
}

export function DocumentLiquidNavBar({
  orders = [],
  selectedFilename,
  onReadOrder,
  onOpenSummary,
  onDownloadPDF,
  aiLoading = false,
}: DocumentLiquidNavBarProps) {
  const [activeTab, setActiveTab] = useState<DocumentTab | null>(null);

  // Find primary valid order
  const currentOrder =
    orders.find((o) => o.filename === selectedFilename) ||
    orders.find((o) => !o.is_stub && o.filename) ||
    orders[0];

  const handleTabClick = (tab: DocumentTab) => {
    setActiveTab(tab);
    const targetFile = currentOrder?.filename || selectedFilename;

    if (tab === "read") {
      onReadOrder(targetFile);
    } else if (tab === "summary") {
      onOpenSummary(targetFile);
    } else if (tab === "pdf") {
      onDownloadPDF(targetFile);
    }
  };

  const tabs: {
    id: DocumentTab;
    label: string;
    icon: React.ElementType;
  }[] = [
    {
      id: "read",
      label: "Read Order",
      icon: BookOpen,
    },
    {
      id: "summary",
      label: "AI Summary",
      icon: Sparkles,
    },
    {
      id: "pdf",
      label: "Court PDF",
      icon: Download,
    },
  ];

  return (
    <div className="w-full flex items-center justify-center my-7 max-w-full px-2">
      {/* Individual Liquid Glass Buttons Container */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isSummaryLoading = tab.id === "summary" && aiLoading;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`liquid-glass-btn group ${isActive ? "active" : ""}`}
              title={tab.label}
            >
              <Icon
                size={17}
                className={`transition-transform duration-200 group-hover:scale-110 flex-shrink-0 ${
                  isSummaryLoading ? "animate-spin text-[var(--brass)]" : ""
                }`}
                style={{
                  color: isActive ? "var(--brass)" : "var(--ink-dim)",
                }}
              />
              <span className="font-medium text-sm sm:text-[14.5px] tracking-tight whitespace-nowrap">
                {isSummaryLoading && tab.id === "summary" ? "Generating Summary..." : tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
