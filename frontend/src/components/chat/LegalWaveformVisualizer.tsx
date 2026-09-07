import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Square, X, Check, Sparkles } from "lucide-react";
import { LegalCorrection } from "@/lib/dictation/legalCorrectionEngine";

interface LegalWaveformVisualizerProps {
  isListening: boolean;
  audioLevel: number;
  interimText: string;
  recentCorrections: LegalCorrection[];
  onStop: () => void;
  onCancel: () => void;
}

const BAR_MULTIPLIERS = [0.55, 0.9, 0.65, 1.25, 0.8, 1.1, 0.5];

export function LegalWaveformVisualizer({
  isListening,
  audioLevel,
  interimText,
  recentCorrections,
  onStop,
  onCancel,
}: LegalWaveformVisualizerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer counter during active dictation
  useEffect(() => {
    if (!isListening) {
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isListening]);

  // Format elapsed time as mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isListening) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full mb-2.5 rounded-2xl border p-3 shadow-lg select-none backdrop-blur-md"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.12)",
        }}
      >
        {/* Top Status & Controls Header */}
        <div className="flex items-center justify-between gap-3 pb-2.5 border-b" style={{ borderColor: "var(--hairline-soft)" }}>
          {/* Left: Recording Seal & Time */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
            </span>

            <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
              Legal Dictation
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-normal"
                style={{ background: "var(--brass-soft)", color: "var(--brass-bright)" }}
              >
                en-IN
              </span>
            </span>

            <span className="text-[11px] font-mono" style={{ color: "var(--ink-faint)" }}>
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          {/* Center: Waveform Visualizer */}
          <div className="flex items-center gap-1.5 h-6 px-2">
            {BAR_MULTIPLIERS.map((multiplier, idx) => {
              // Calculate responsive height: base height + audio volume scaling
              const dynamicHeight = Math.max(
                5,
                Math.min(24, Math.round(6 + audioLevel * 18 * multiplier))
              );

              return (
                <motion.div
                  key={idx}
                  className="w-1 rounded-full"
                  style={{
                    backgroundColor: "var(--brass)",
                  }}
                  animate={{
                    height: dynamicHeight,
                    opacity: 0.45 + (audioLevel > 0.05 ? audioLevel * 0.55 : (idx % 2 === 0 ? 0.35 : 0.2)),
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                />
              );
            })}
          </div>

          {/* Right: Tactile Actions (Insert / Stop / Discard) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onStop}
              className="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              style={{
                background: "var(--brass)",
                color: "#FFFFFF",
              }}
              title="Stop and insert dictation"
            >
              <Check size={12} strokeWidth={2.5} />
              <span>Done</span>
            </button>

            <button
              type="button"
              onClick={onStop}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:bg-red-500/10 text-red-600"
              title="Stop recording"
            >
              <Square size={13} fill="currentColor" />
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: "var(--ink-faint)" }}
              title="Cancel (Esc)"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Live Interim Speech Preview Ghost Text */}
        <div className="pt-2 min-h-[30px] flex items-center">
          {interimText ? (
            <p className="text-xs sm:text-[13px] leading-relaxed italic" style={{ color: "var(--ink)" }}>
              "{interimText}"
              <span
                className="inline-block w-1.5 h-3.5 ml-1 rounded-xs animate-pulse align-middle"
                style={{ backgroundColor: "var(--brass)" }}
              />
            </p>
          ) : (
            <p className="text-xs italic" style={{ color: "var(--ink-faint)" }}>
              Speak legal questions, citations (e.g. "Section 482 of CrPC", "res judicata", "interim stay"), or plead your argument...
            </p>
          )}
        </div>

        {/* Auto-Corrections Badge Pill List */}
        {recentCorrections.length > 0 && (
          <div className="mt-2 pt-2 border-t flex flex-wrap items-center gap-1.5" style={{ borderColor: "var(--hairline-soft)" }}>
            <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: "var(--brass-bright)" }}>
              <Sparkles size={11} /> Auto-Corrected:
            </span>
            {recentCorrections.slice(-3).map((correction, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium"
                style={{
                  background: "var(--surface-container)",
                  color: "var(--ink)",
                  border: "1px solid var(--border)",
                }}
              >
                <span className="line-through text-[10px]" style={{ color: "var(--ink-faint)" }}>
                  {correction.original}
                </span>
                <span>→</span>
                <strong style={{ color: "var(--brass)" }}>{correction.corrected}</strong>
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
