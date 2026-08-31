import React, { useEffect, useRef, useState, useCallback } from "react";
import type { CitationNode, CitationLink, CourtTier } from "@/types/citation";

interface CitationGraphCanvasProps {
  nodes: CitationNode[];
  links: CitationLink[];
  selectedNodeId: string | null;
  onSelectNode: (node: CitationNode | null) => void;
  activeFilter: string;
  zoomLevel: number;
  onZoomChange?: (z: number) => void;
  panOffset: { x: number; y: number };
  onPanChange?: (pan: { x: number; y: number }) => void;
}

export function CitationGraphCanvas({
  nodes: rawNodes,
  links: rawLinks,
  selectedNodeId,
  onSelectNode,
  activeFilter,
  zoomLevel,
  onZoomChange,
  panOffset,
  onPanChange,
}: CitationGraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Simulation internal state
  const simulationNodesRef = useRef<CitationNode[]>([]);
  const simulationLinksRef = useRef<CitationLink[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Viewport transformation state
  const transformRef = useRef({ x: panOffset.x, y: panOffset.y, k: zoomLevel });
  const hoveredNodeIdRef = useRef<string | null>(null);
  const isDraggingCanvasRef = useRef(false);
  const isDraggingNodeRef = useRef<CitationNode | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<CitationNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Keep transformRef in sync with props
  useEffect(() => {
    transformRef.current.k = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    transformRef.current.x = panOffset.x;
    transformRef.current.y = panOffset.y;
  }, [panOffset]);

  // Color lookup helper matching exact dark/light mode mockup
  const getNodeColor = useCallback((tier: CourtTier, isTarget: boolean, isDark: boolean) => {
    if (isTarget) {
      return {
        fill: isDark ? "#181B22" : "#FFFEFB",
        innerBorder: isDark ? "#E5A93C" : "#D49B28",
        outerRing: isDark ? "#F2BD54" : "#E8AB30",
        textColor: isDark ? "#FFFFFF" : "#1A1D24",
      };
    }

    if (tier === "sc") {
      // Supreme Court: Blue
      return {
        fill: isDark ? "#172338" : "#EBF4FD",
        innerBorder: isDark ? "#4B8FE2" : "#3B82F6",
        outerRing: isDark ? "#4B8FE2" : "#3B82F6",
        textColor: isDark ? "#FFFFFF" : "#1E40AF",
      };
    }

    if (tier === "statute") {
      // Statute / Act: Purple
      return {
        fill: isDark ? "#261D36" : "#F5EEFD",
        innerBorder: isDark ? "#A775F8" : "#8B5CF6",
        outerRing: isDark ? "#A775F8" : "#8B5CF6",
        textColor: isDark ? "#FFFFFF" : "#6D28D9",
      };
    }

    if (tier === "hc") {
      // High Court: Green
      return {
        fill: isDark ? "#142820" : "#EDF8F1",
        innerBorder: isDark ? "#3FB950" : "#10B981",
        outerRing: isDark ? "#3FB950" : "#10B981",
        textColor: isDark ? "#FFFFFF" : "#065F46",
      };
    }

    // Subsequent Case / Tribunal: Slate / Gray
    return {
      fill: isDark ? "#22262E" : "#F3F4F6",
      innerBorder: isDark ? "#8B949E" : "#6B7280",
      outerRing: isDark ? "#8B949E" : "#6B7280",
      textColor: isDark ? "#FFFFFF" : "#374151",
    };
  }, []);

  // Initialize Force Simulation with spacious, non-overlapping radial orbit
  useEffect(() => {
    if (!rawNodes || rawNodes.length === 0) return;

    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 660;
    const cx = width / 2;
    const cy = height / 2;

    const nonTargetNodes = rawNodes.filter((n) => n.node_type !== "target");
    const totalOuter = nonTargetNodes.length;

    let outerIdx = 0;
    const simNodes: CitationNode[] = rawNodes.map((n) => {
      const isTarget = n.node_type === "target";
      const radius = isTarget ? 30 : 20;

      let initX = cx;
      let initY = cy;
      if (!isTarget) {
        // Distribute nodes evenly along an expansive ellipse with generous spacing
        const angle = (outerIdx / Math.max(1, totalOuter)) * 2 * Math.PI - Math.PI / 2;
        // Alternate radial distances slightly to create a staggered, organic depth
        const distOffset = (outerIdx % 2 === 0 ? 0 : 35);
        const rx = Math.min(width * 0.40, 320) + distOffset;
        const ry = Math.min(height * 0.38, 220) + distOffset * 0.7;
        initX = cx + Math.cos(angle) * rx;
        initY = cy + Math.sin(angle) * ry;
        outerIdx++;
      }

      return {
        ...n,
        x: initX,
        y: initY,
        vx: 0,
        vy: 0,
        radius,
      };
    });

    const nodeMap = new Map<string, CitationNode>();
    simNodes.forEach((n) => nodeMap.set(n.id, n));

    const targetNode = simNodes.find((n) => n.node_type === "target");

    // Only connect radial links from Target to outer nodes to maintain clean star layout
    const simLinks: CitationLink[] = [];
    if (targetNode) {
      simNodes.forEach((n) => {
        if (n.id !== targetNode.id) {
          simLinks.push({
            source: targetNode,
            target: n,
            relationship: n.node_type === "citing" ? "cited_by" : "relies_upon",
            weight: 1.0,
          });
        }
      });
    }

    simulationNodesRef.current = simNodes;
    simulationLinksRef.current = simLinks;
  }, [rawNodes, rawLinks]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let isRunning = true;
    let iteration = 0;

    const render = () => {
      if (!isRunning) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const nodes = simulationNodesRef.current;
      const links = simulationLinksRef.current;
      const { x: tx, y: ty, k } = transformRef.current;
      const hoveredId = hoveredNodeIdRef.current;

      // 1. Force Simulation Step (smooth, quickly stabilizing, preserving angular separation)
      const alpha = Math.max(0.001, Math.pow(0.965, iteration));
      iteration++;

      if (alpha > 0.002 && nodes.length > 0) {
        const cx = width / 2;
        const cy = height / 2;

        // Keep target firmly anchored at center
        nodes.forEach((n) => {
          if (n.node_type === "target") {
            n.vx! += (cx - n.x!) * 0.25 * alpha;
            n.vy! += (cy - n.y!) * 0.25 * alpha;
          }
        });

        // Strong repulsion between outer nodes to prevent any text collisions
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const n1 = nodes[i];
            const n2 = nodes[j];
            const dx = n2.x! - n1.x!;
            const dy = n2.y! - n1.y!;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);
            // Generous minimum distance so labels never overlap
            const minDist = (n1.radius || 20) + (n2.radius || 20) + 75;

            if (dist < minDist) {
              const repulse = (minDist - dist) * 0.08 * alpha;
              const fx = (dx / dist) * repulse;
              const fy = (dy / dist) * repulse;

              if (n1.node_type !== "target" && isDraggingNodeRef.current !== n1) {
                n1.vx! -= fx;
                n1.vy! -= fy;
              }
              if (n2.node_type !== "target" && isDraggingNodeRef.current !== n2) {
                n2.vx! += fx;
                n2.vy! += fy;
              }
            }
          }
        }

        // Radial spring force from center
        const targetNode = nodes.find((n) => n.node_type === "target");
        if (targetNode) {
          nodes.forEach((n, idx) => {
            if (n.node_type === "target") return;
            const dx = n.x! - targetNode.x!;
            const dy = n.y! - targetNode.y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            // Optimal radial distance
            const targetDist = 210 + (idx % 3) * 35;
            const diff = dist - targetDist;
            const force = diff * 0.025 * alpha;

            if (isDraggingNodeRef.current !== n) {
              n.vx! -= (dx / dist) * force;
              n.vy! -= (dy / dist) * force;
            }
          });
        }

        // Apply velocity with damping & boundary clamping
        nodes.forEach((n) => {
          if (isDraggingNodeRef.current === n) return;
          n.vx! *= 0.75;
          n.vy! *= 0.75;
          n.x! += n.vx!;
          n.y! += n.vy!;

          const padX = (n.radius || 20) + 60;
          const padY = (n.radius || 20) + 40;
          n.x = Math.max(padX, Math.min(width - padX, n.x!));
          n.y = Math.max(padY, Math.min(height - padY, n.y!));
        });
      }

      // 2. Solid Background (Clean, elegant, no grid)
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      ctx.save();
      ctx.fillStyle = isDark ? "#0E131F" : "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      // 3. Viewport Transformation
      ctx.translate(tx, ty);
      ctx.scale(k, k);

      // Highlight set
      const connectedNodeIds = new Set<string>();
      if (hoveredId || selectedNodeId) {
        const activeId = hoveredId || selectedNodeId;
        connectedNodeIds.add(activeId!);
        links.forEach((l) => {
          const sId = (l.source as CitationNode).id;
          const tId = (l.target as CitationNode).id;
          if (sId === activeId) connectedNodeIds.add(tId);
          if (tId === activeId) connectedNodeIds.add(sId);
        });
      }

      const isNodeDimmed = (node: CitationNode) => {
        if (activeFilter !== "all") {
          if (activeFilter === "sc") return node.court_tier !== "sc";
          if (activeFilter === "hc") return node.court_tier !== "hc";
          if (activeFilter === "statute") return node.node_type !== "statute";
          if (activeFilter === "citing") return node.node_type !== "citing";
        }
        if ((hoveredId || selectedNodeId) && connectedNodeIds.size > 0) {
          return !connectedNodeIds.has(node.id);
        }
        return false;
      };

      // 4. Draw Clean DASHED Lines (Matching exact design mockup)
      links.forEach((link) => {
        const s = link.source as CitationNode;
        const t = link.target as CitationNode;
        const isHighlight =
          (hoveredId && (s.id === hoveredId || t.id === hoveredId)) ||
          (selectedNodeId && (s.id === selectedNodeId || t.id === selectedNodeId));
        const isDimmed = (hoveredId || selectedNodeId) && !isHighlight;

        ctx.save();
        ctx.setLineDash([3, 4]);

        ctx.beginPath();
        ctx.moveTo(s.x!, s.y!);
        ctx.lineTo(t.x!, t.y!);

        if (isHighlight) {
          ctx.strokeStyle = isDark ? "#F2BD54" : "#D49B28";
          ctx.lineWidth = 1.8;
          ctx.setLineDash([4, 3]);
        } else {
          ctx.strokeStyle = isDark
            ? isDimmed
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(255, 255, 255, 0.20)"
            : isDimmed
            ? "rgba(0, 0, 0, 0.05)"
            : "rgba(0, 0, 0, 0.18)";
          ctx.lineWidth = 1.1;
        }
        ctx.stroke();
        ctx.restore();
      });

      // 5. Draw Nodes (NO GLOW — Flat, Crisp & Aesthetic)
      nodes.forEach((node) => {
        const isTarget = node.node_type === "target";
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredId === node.id;
        const dimmed = isNodeDimmed(node);
        const colors = getNodeColor(node.court_tier, isTarget, isDark);
        const r = node.radius || 20;

        ctx.save();
        ctx.globalAlpha = dimmed ? 0.22 : 1.0;

        if (isTarget) {
          // --- Center "ACTIVE" Target Node: Double Concentric Ring ---

          // Outer Thin Gold Circle Ring
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, r + 6, 0, Math.PI * 2);
          ctx.strokeStyle = colors.outerRing;
          ctx.lineWidth = 1.3;
          ctx.stroke();

          // Inner Circle Body
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, r, 0, Math.PI * 2);
          ctx.fillStyle = colors.fill;
          ctx.fill();
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = colors.innerBorder;
          ctx.stroke();

          // "ACTIVE" Text
          ctx.fillStyle = colors.textColor;
          ctx.font = "700 11px 'IBM Plex Sans', system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("ACTIVE", node.x!, node.y!);

          // Case Name underneath (Bold, clean, elegant)
          ctx.font = "700 13px 'IBM Plex Sans', system-ui, sans-serif";
          ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          const displayTitle =
            node.title.length > 24 ? `${node.title.substring(0, 22)}...` : node.title;
          ctx.fillText(displayTitle, node.x!, node.y! + r + 10);
        } else {
          // --- Outer Precedent / Statute Nodes ---

          // Node Circle Body
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, r, 0, Math.PI * 2);
          ctx.fillStyle = colors.fill;
          ctx.fill();
          ctx.lineWidth = isSelected || isHovered ? 2.0 : 1.4;
          ctx.strokeStyle = colors.innerBorder;
          ctx.stroke();

          // Badge Text (e.g. "SC", "ACT", "HC", "CASE")
          ctx.fillStyle = colors.textColor;
          ctx.font = "700 10.5px 'IBM Plex Sans', system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const shortLabel =
            node.node_type === "statute"
              ? "ACT"
              : node.court_tier === "sc"
              ? "SC"
              : node.court_tier === "hc"
              ? "HC"
              : "CASE";
          ctx.fillText(shortLabel, node.x!, node.y!);

          // Label Text underneath (Formatted cleanly to prevent collisions)
          ctx.font = "500 11.5px 'IBM Plex Sans', system-ui, sans-serif";
          ctx.fillStyle = isDark ? "#E2E8F0" : "#334155";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";

          const displayTitle =
            node.title.length > 20 ? `${node.title.substring(0, 18)}...` : node.title;
          ctx.fillText(displayTitle, node.x!, node.y! + r + 7);
        }

        ctx.restore();
      });

      ctx.restore();
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [getNodeColor, selectedNodeId, activeFilter]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Screen coordinate to World coordinate converter
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const { x, y, k } = transformRef.current;
    return {
      x: (screenX - x) / k,
      y: (screenY - y) / k,
    };
  }, []);

  // Find node under mouse
  const getNodeAtPos = useCallback(
    (screenX: number, screenY: number) => {
      const world = screenToWorld(screenX, screenY);
      const nodes = simulationNodesRef.current;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const dx = world.x - n.x!;
        const dy = world.y - n.y!;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= (n.radius || 20) + 6) {
          return n;
        }
      }
      return null;
    },
    [screenToWorld]
  );

  // Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const node = getNodeAtPos(mx, my);

    if (node) {
      isDraggingNodeRef.current = node;
      node.fx = node.x;
      node.fy = node.y;
    } else {
      isDraggingCanvasRef.current = true;
      dragStartPosRef.current = {
        x: mx - transformRef.current.x,
        y: my - transformRef.current.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDraggingNodeRef.current) {
      const world = screenToWorld(mx, my);
      const node = isDraggingNodeRef.current;
      node.x = world.x;
      node.y = world.y;
      node.fx = world.x;
      node.fy = world.y;
    } else if (isDraggingCanvasRef.current) {
      const newX = mx - dragStartPosRef.current.x;
      const newY = my - dragStartPosRef.current.y;
      transformRef.current.x = newX;
      transformRef.current.y = newY;
      onPanChange?.({ x: newX, y: newY });
    } else {
      const node = getNodeAtPos(mx, my);
      if (node) {
        hoveredNodeIdRef.current = node.id;
        setHoveredNode(node);
        setTooltipPos({ x: mx + 15, y: my + 15 });
        if (canvasRef.current) canvasRef.current.style.cursor = "pointer";
      } else {
        hoveredNodeIdRef.current = null;
        setHoveredNode(null);
        setTooltipPos(null);
        if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      }
    }
  };

  const handleMouseUp = () => {
    if (isDraggingNodeRef.current) {
      isDraggingNodeRef.current.fx = null;
      isDraggingNodeRef.current.fy = null;
      isDraggingNodeRef.current = null;
    }
    isDraggingCanvasRef.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const node = getNodeAtPos(mx, my);
    onSelectNode(node);
  };

  // Only zoom when Ctrl or Meta key is pressed; otherwise allow normal page scrolling!
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!e.ctrlKey && !e.metaKey) {
      return;
    }
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const currentK = transformRef.current.k;
    const newK = Math.max(0.5, Math.min(2.5, currentK * zoomFactor));

    const newX = mx - (mx - transformRef.current.x) * (newK / currentK);
    const newY = my - (my - transformRef.current.y) * (newK / currentK);

    transformRef.current.k = newK;
    transformRef.current.x = newX;
    transformRef.current.y = newY;

    onZoomChange?.(newK);
    onPanChange?.({ x: newX, y: newY });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[660px] rounded-2xl overflow-hidden border select-none transition-all"
      style={{
        background: "var(--surface)",
        borderColor: "var(--hairline)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full block"
      />

      {/* Floating Hover Tooltip */}
      {hoveredNode && tooltipPos && (
        <div
          className="absolute z-20 pointer-events-none p-2.5 rounded-lg border text-xs max-w-xs backdrop-blur-md shadow-xl transition-all"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            background: "var(--glass-bg)",
            borderColor: "var(--hairline)",
            color: "var(--ink)",
          }}
        >
          <div className="font-semibold font-display line-clamp-2">{hoveredNode.title}</div>
          <div className="text-[10.5px] font-mono opacity-70 pt-0.5">
            {hoveredNode.court || "Supreme Court"} • {hoveredNode.year || "Law"}
          </div>
          <div className="text-[11px] font-mono pt-1 font-bold" style={{ color: "var(--brass)" }}>
            Authority Score: {hoveredNode.authority_score} / 100 ({hoveredNode.inbound_count} citations)
          </div>
        </div>
      )}
    </div>
  );
}
