import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { SiriWaveOrb } from "./SiriWaveOrb";
import { useThemeStore } from "@/store/theme-store";

interface SiriLegalVisualizerProps {
  isListening: boolean;
  audioLevel: number;
  interimText: string;
}

const PILL_W = 160;
const PILL_H = 48;
const WAVE_W = 140;
const WAVE_H = 40;

export function SiriLegalVisualizer({
  isListening,
  audioLevel,
}: SiriLegalVisualizerProps) {
  if (typeof document === "undefined") return null;

  const theme = useThemeStore((s) => s.theme);

  // Theme-aware halo glow: Light Mode = Slate Blue (62, 124, 166), Dark Mode = Warm Orange (245, 130, 32)
  const isDark = theme === "dark";
  const haloRgb = isDark ? "245, 130, 32" : "62, 124, 166";
  const haloAlpha = isDark ? 0.20 + audioLevel * 0.28 : 0.16 + audioLevel * 0.24;

  return createPortal(
    <AnimatePresence>
      {isListening && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none select-none">
          {/* Ambient luminous halo behind the crystal glass capsule */}
          <motion.div
            className="absolute inset-0"
            style={{
              borderRadius: 999,
              background: `radial-gradient(ellipse at 50% 50%, rgba(${haloRgb}, ${haloAlpha}) 0%, transparent 80%)`,
              filter: "blur(22px)",
              transform: `scale(${1.65 + audioLevel * 0.25})`,
            }}
            animate={{ opacity: [0.65, 1.0, 0.65] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* 100% Transparent iPhone-Style Liquid Glass Capsule */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0.55, scaleY: 0.75, filter: "blur(14px)" }}
            animate={{ opacity: 1, scaleX: 1, scaleY: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scaleX: 0.6, scaleY: 0.8, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 520, damping: 30 }}
            className="relative flex items-center justify-center overflow-hidden"
            style={{
              width: PILL_W,
              height: PILL_H,
              borderRadius: 999,
              // 100% transparent liquid glass with pure optical refraction
              background: "transparent",
              backdropFilter: "blur(28px) saturate(190%)",
              WebkitBackdropFilter: "blur(28px) saturate(190%)",
              border: isDark
                ? "1px solid rgba(255, 255, 255, 0.18)"
                : "1px solid rgba(255, 255, 255, 0.65)",
              boxShadow: isDark
                ? `
                  0 12px 36px -4px rgba(0, 0, 0, 0.55),
                  0 0 20px rgba(${haloRgb}, ${0.15 + audioLevel * 0.20}),
                  inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.45),
                  inset 0 -1px 1px 0 rgba(0, 0, 0, 0.25)
                `
                : `
                  0 10px 30px -4px rgba(0, 0, 0, 0.12),
                  0 0 20px rgba(${haloRgb}, ${0.12 + audioLevel * 0.18}),
                  inset 0 1px 2px 0 rgba(255, 255, 255, 0.85),
                  inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05)
                `,
            }}
          >
            {/* Top specular reflection arc (iPhone lens refraction) */}
            <div
              className="absolute top-0 left-4 right-4 pointer-events-none"
              style={{
                height: 1.2,
                background: isDark
                  ? "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.65) 30%, rgba(255, 255, 255, 0.65) 70%, transparent 100%)"
                  : "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.95) 30%, rgba(255, 255, 255, 0.95) 70%, transparent 100%)",
                borderRadius: 999,
              }}
            />

            {/* Dynamic Waveform Canvas */}
            <SiriWaveOrb
              audioLevel={audioLevel}
              width={WAVE_W}
              height={WAVE_H}
              isListening={isListening}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
