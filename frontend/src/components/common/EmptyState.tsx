import React from "react";
import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode | React.ComponentType<{ size?: number; className?: string }>;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  let renderedIcon: React.ReactNode = <SearchX size={28} />;

  if (React.isValidElement(icon)) {
    renderedIcon = icon;
  } else if (typeof icon === "function" || (icon && typeof icon === "object" && "$$typeof" in (icon as any))) {
    renderedIcon = React.createElement(icon as any, { size: 28 });
  } else if (icon) {
    renderedIcon = icon as React.ReactNode;
  }

  return (
    <div
      className="card-float flex flex-col items-center justify-center text-center p-12 w-full"
      style={{ minHeight: "300px" }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "var(--surface-container)", color: "var(--text-muted)" }}
      >
        {renderedIcon}
      </div>
      <h3 className="text-lg font-semibold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-sm mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      )}
      {action && <div className={description ? "" : "mt-4"}>{action}</div>}
    </div>
  );
}
