import React, { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Sparkles, Download } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<DocumentTab>("read");
  const [hoveredTab, setHoveredTab] = useState<DocumentTab | null>(null);

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
    <div className="w-full flex items-center justify-center my-8 max-w-full px-2">
      {/* Prominent Liquid Capsule Floating Bar */}
      <div
        className="relative inline-flex items-center p-1.5 sm:p-2.5 rounded-full transition-all max-w-full overflow-hidden"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow:
            "0 10px 30px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;
          const isSummaryLoading = tab.id === "summary" && aiLoading;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className="relative px-5 py-2.5 sm:px-8 sm:py-3 rounded-full flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none outline-none transition-colors"
            >
              {/* Liquid Active Indicator with Spring Physics */}
              {isActive && (
                <motion.div
                  layoutId="liquid-active-pill"
                  className="absolute inset-0 rounded-full z-0"
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 32,
                  }}
                  style={{
                    background: "var(--primary)",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
                  }}
                />
              )}

              {/* Inactive Hover Indicator */}
              {!isActive && isHovered && (
                <motion.div
                  layoutId="liquid-hover-pill"
                  className="absolute inset-0 rounded-full z-0"
                  transition={{ duration: 0.15 }}
                  style={{
                    background: "var(--surface-container)",
                  }}
                />
              )}

              {/* Tab Icon */}
              <motion.div
                animate={{
                  scale: isActive ? 1.08 : isHovered ? 1.06 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative z-10 flex items-center justify-center"
              >
                <Icon
                  size={18}
                  className={`transition-colors duration-200 ${
                    isSummaryLoading ? "animate-spin" : ""
                  }`}
                  style={{
                    color: isActive
                      ? "var(--on-primary)"
                      : "var(--text-secondary)",
                  }}
                />
              </motion.div>

              {/* Tab Label */}
              <span
                className="relative z-10 text-sm sm:text-[15px] font-semibold tracking-tight transition-colors duration-200 whitespace-nowrap"
                style={{
                  color: isActive
                    ? "var(--on-primary)"
                    : "var(--text-secondary)",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
