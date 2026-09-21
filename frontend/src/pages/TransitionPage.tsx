import React from "react";
import { EraTransitionExplorer } from "@/components/research/EraTransitionExplorer";

export default function TransitionPage() {
  return (
    <div className="dashboard-layout" style={{ maxWidth: "100%", width: "100%", marginTop: 36 }}>
      <EraTransitionExplorer />
    </div>
  );
}
