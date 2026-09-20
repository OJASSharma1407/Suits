import React, { useState, useRef, useEffect } from 'react';
import {
  Cpu,
  Cloud,
  WifiOff,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Terminal,
  ChevronDown,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useAIModeStore } from '@/store/ai-mode-store';

interface AIModeIndicatorProps {
  placement?: 'bottom-right' | 'top-left' | 'top-right';
  fullWidth?: boolean;
}

export const AIModeIndicator: React.FC<AIModeIndicatorProps> = ({
  placement = 'bottom-right',
  fullWidth = false,
}) => {
  const {
    mode,
    isOffline,
    ollamaStatus,
    setMode,
    getEffectiveProvider,
    checkOllamaHealth,
  } = useAIModeStore();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveProvider = getEffectiveProvider();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    const newMode = mode === 'cloud' ? 'local' : 'cloud';
    setMode(newMode);
    if (newMode === 'local') {
      checkOllamaHealth();
    }
  };

  const getDropdownPos = () => {
    if (placement === 'top-left') {
      return 'left-0 bottom-full mb-2';
    }
    if (placement === 'top-right') {
      return 'right-0 bottom-full mb-2';
    }
    return 'right-0 top-full mt-2';
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`} ref={containerRef}>
      {/* Status Pill Button */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) checkOllamaHealth();
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer select-none ${
          fullWidth ? 'w-full justify-between py-2 px-3.5' : 'rounded-full'
        }`}
        style={{
          background:
            effectiveProvider === 'local'
              ? 'rgba(39, 174, 96, 0.1)'
              : 'var(--surface-raised)',
          borderColor:
            effectiveProvider === 'local'
              ? 'rgba(39, 174, 96, 0.4)'
              : 'var(--hairline)',
          color: 'var(--ink)',
        }}
        title={`Active AI: ${effectiveProvider === 'local' ? 'Local Ollama (Qwen 7B)' : 'Cloud AI (Gemini / OpenRouter)'}`}
      >
        <div className="flex items-center gap-2">
          {isOffline ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <WifiOff size={13} className="text-amber-500" />
              <span className="font-semibold text-amber-600 dark:text-amber-400">Offline (Local AI)</span>
            </>
          ) : effectiveProvider === 'local' ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <Cpu size={13} className="text-emerald-500" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Local AI (Qwen 7B)</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <Cloud size={13} style={{ color: 'var(--brass-bright)' }} />
              <span style={{ color: 'var(--ink-dim)' }}>Cloud AI</span>
            </>
          )}
        </div>

        <ChevronDown size={12} style={{ color: 'var(--ink-faint)' }} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className={`absolute ${getDropdownPos()} w-80 rounded-xl border card-float shadow-2xl z-50 p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150`}
          style={{
            background: 'var(--surface-raised)',
            borderColor: 'var(--hairline)',
            color: 'var(--ink)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--hairline)' }}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} style={{ color: 'var(--brass)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                AI Engine & Local Mode
              </span>
            </div>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded font-medium"
              style={{
                background: effectiveProvider === 'local' ? 'rgba(39, 174, 96, 0.12)' : 'var(--surface)',
                color: effectiveProvider === 'local' ? '#27ae60' : 'var(--ink-faint)',
                border: '1px solid var(--hairline)',
              }}
            >
              {effectiveProvider.toUpperCase()} ACTIVE
            </span>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--hairline)' }}>
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                Force Local AI (Ollama)
              </div>
              <div className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--ink-faint)' }}>
                Routes all AI calls to local Qwen 7B (0 tokens, 100% private).
              </div>
            </div>

            {/* Switch Input */}
            <button
              type="button"
              role="switch"
              aria-checked={mode === 'local'}
              onClick={handleToggle}
              className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              style={{
                backgroundColor: mode === 'local' ? 'var(--brass)' : 'var(--hairline)',
              }}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  mode === 'local' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Offline Mode Note */}
          {isOffline && (
            <div
              className="p-2.5 rounded-lg border text-[11px] leading-relaxed flex items-center gap-2"
              style={{ background: 'rgba(242, 201, 76, 0.08)', borderColor: 'rgba(242, 201, 76, 0.3)', color: '#d48806' }}
            >
              <WifiOff size={14} className="shrink-0" />
              <span>Internet disconnected. Local Ollama automatically engaged for all operations.</span>
            </div>
          )}

          {/* Ollama Daemon Status */}
          <div className="space-y-2 pt-1 border-t" style={{ borderColor: 'var(--hairline-soft)' }}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[11px] uppercase tracking-wider font-mono" style={{ color: 'var(--ink-faint)' }}>
                Ollama Daemon (localhost:11434)
              </span>
              <button
                onClick={() => checkOllamaHealth()}
                disabled={ollamaStatus.checking}
                className="flex items-center gap-1 text-[11px] transition-opacity disabled:opacity-50"
                style={{ color: 'var(--brass-bright)' }}
                title="Refresh Ollama status"
              >
                <RotateCcw size={10} className={ollamaStatus.checking ? 'animate-spin' : ''} />
                <span>{ollamaStatus.checking ? 'Checking…' : 'Check'}</span>
              </button>
            </div>

            {ollamaStatus.running ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                  <span>Ollama daemon running</span>
                </div>
                <div className="text-[11px]" style={{ color: 'var(--ink-dim)' }}>
                  Configured: <code className="font-mono">{ollamaStatus.modelConfigured}</code>
                  {ollamaStatus.modelReady ? (
                    <span className="ml-1.5 text-emerald-500 font-semibold">(Installed & Ready)</span>
                  ) : (
                    <span className="ml-1.5 text-amber-500 font-semibold">(Not installed)</span>
                  )}
                </div>
                {!ollamaStatus.modelReady && (
                  <div
                    className="p-1.5 rounded font-mono text-[10px] flex items-center justify-between border mt-1"
                    style={{ background: 'var(--surface)', borderColor: 'var(--hairline)', color: 'var(--ink)' }}
                  >
                    <span>ollama run {ollamaStatus.modelConfigured}</span>
                    <Terminal size={11} style={{ color: 'var(--ink-faint)' }} />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-rose-500">
                  <XCircle size={13} className="shrink-0" />
                  <span>Ollama not detected</span>
                </div>
                <p className="text-[10.5px] leading-relaxed" style={{ color: 'var(--ink-faint)' }}>
                  Run <code className="font-mono">ollama serve</code> to start the daemon.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
