import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Cpu,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Terminal,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAIModeStore } from '@/store/ai-mode-store';

export const SwitchToOllamaModal: React.FC = () => {
  const {
    showLimitModal,
    limitReason,
    ollamaStatus,
    checkOllamaHealth,
    closeLimitModal,
    switchToLocalAndRetry,
  } = useAIModeStore();

  useEffect(() => {
    if (showLimitModal) {
      checkOllamaHealth();
    }
  }, [showLimitModal, checkOllamaHealth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLimitModal) {
        closeLimitModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLimitModal, closeLimitModal]);

  if (!showLimitModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLimitModal}
          className="fixed inset-0 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-xl overflow-hidden card-float shadow-2xl border"
          style={{
            background: 'var(--surface-raised)',
            borderColor: 'var(--hairline)',
            color: 'var(--ink)',
          }}
        >
          {/* Header */}
          <div
            className="p-5 sm:p-6 border-b flex items-start justify-between gap-3"
            style={{
              borderColor: 'var(--hairline)',
              background: 'var(--surface)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: 'rgba(212, 175, 55, 0.12)',
                  color: 'var(--brass-bright)',
                  border: '1px solid var(--hairline)',
                }}
              >
                <Cpu size={22} />
              </div>
              <div>
                <h3
                  className="text-base font-semibold tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
                >
                  Online AI Limit Reached
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--ink-faint)' }}>
                  Cloud API quota exhausted • Switch to Local Ollama
                </p>
              </div>
            </div>

            <button
              onClick={closeLimitModal}
              className="p-1 rounded hover:bg-[var(--surface-raised)] transition-colors"
              style={{ color: 'var(--ink-faint)' }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-4">
            <div
              className="p-3.5 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5"
              style={{
                background: 'rgba(242, 201, 76, 0.08)',
                borderColor: 'rgba(242, 201, 76, 0.3)',
                color: 'var(--ink)',
              }}
            >
              <AlertTriangle size={16} className="shrink-0 text-amber-500 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-600 dark:text-amber-400">Notice: </span>
                {limitReason || 'Online AI API rate limit or quota reached.'}
                <span className="block mt-1" style={{ color: 'var(--ink-dim)' }}>
                  Switch to <strong>Local Ollama (Qwen 7B)</strong> to continue running AI analysis, headnotes, predictions, and legal chat with 0 cloud tokens and complete privacy.
                </span>
              </div>
            </div>

            {/* Live Ollama Diagnostic Box */}
            <div
              className="p-4 rounded-lg border space-y-3"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--hairline)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: 'var(--ink-faint)' }}>
                  Local Ollama Daemon Status
                </span>
                <button
                  onClick={() => checkOllamaHealth()}
                  disabled={ollamaStatus.checking}
                  className="flex items-center gap-1 text-[11px] font-medium transition-opacity disabled:opacity-50"
                  style={{ color: 'var(--brass-bright)' }}
                  title="Check connection to Ollama"
                >
                  <RotateCcw size={11} className={ollamaStatus.checking ? 'animate-spin' : ''} />
                  <span>{ollamaStatus.checking ? 'Checking…' : 'Refresh'}</span>
                </button>
              </div>

              {/* Status Indicator */}
              {ollamaStatus.running ? (
                ollamaStatus.modelReady ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    <span>Ollama is running with <strong>{ollamaStatus.modelConfigured}</strong> ready.</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400">
                      <AlertTriangle size={16} className="shrink-0 text-amber-500" />
                      <span>Ollama is running, but model <strong>{ollamaStatus.modelConfigured}</strong> is not installed.</span>
                    </div>
                    <div
                      className="p-2 rounded font-mono text-[11px] flex items-center justify-between border"
                      style={{ background: 'var(--surface-raised)', borderColor: 'var(--hairline)', color: 'var(--ink)' }}
                    >
                      <span>ollama run {ollamaStatus.modelConfigured}</span>
                      <Terminal size={13} style={{ color: 'var(--ink-faint)' }} />
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-medium text-rose-500">
                    <XCircle size={16} className="shrink-0" />
                    <span>Ollama is not running on localhost:11434.</span>
                  </div>
                  <p className="text-[11.5px]" style={{ color: 'var(--ink-dim)' }}>
                    Start the Ollama app or run <code className="font-mono font-semibold">ollama serve</code> in your terminal, then pull the model with <code className="font-mono font-semibold">ollama run {ollamaStatus.modelConfigured}</code>.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className="p-4 sm:p-5 border-t flex items-center justify-end gap-2.5"
            style={{
              borderColor: 'var(--hairline)',
              background: 'var(--surface)',
            }}
          >
            <button
              onClick={closeLimitModal}
              className="btn btn-ghost text-xs font-medium"
              style={{ padding: '8px 16px', color: 'var(--ink-dim)', border: '1px solid var(--hairline)' }}
            >
              Dismiss
            </button>

            <button
              onClick={() => switchToLocalAndRetry()}
              className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all"
              style={{
                background: 'var(--brass)',
                color: '#fff',
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)',
              }}
            >
              <Cpu size={14} />
              <span>Switch to Local Ollama & Retry</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
