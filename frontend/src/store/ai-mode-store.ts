import { create } from 'zustand';
import axios from 'axios';

export type AIMode = 'cloud' | 'local';

export interface OllamaStatus {
  running: boolean;
  modelReady: boolean;
  checking: boolean;
  modelConfigured: string;
  models: string[];
  error?: string;
  message?: string;
}

interface AIModeState {
  mode: AIMode;
  isOffline: boolean;
  ollamaStatus: OllamaStatus;
  showLimitModal: boolean;
  limitReason: string;
  pendingRetry: (() => Promise<any> | void) | null;

  setMode: (mode: AIMode) => void;
  setIsOffline: (isOffline: boolean) => void;
  getEffectiveProvider: () => AIMode;
  checkOllamaHealth: () => Promise<void>;
  triggerLimitModal: (reason?: string, retryFn?: () => Promise<any> | void) => void;
  closeLimitModal: () => void;
  switchToLocalAndRetry: () => Promise<void>;
}

const STORAGE_KEY = 'suits_ai_mode';

export const useAIModeStore = create<AIModeState>((set, get) => ({
  mode: (localStorage.getItem(STORAGE_KEY) as AIMode) || 'cloud',
  isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  ollamaStatus: {
    running: false,
    modelReady: false,
    checking: false,
    modelConfigured: 'qwen2.5:7b',
    models: [],
  },
  showLimitModal: false,
  limitReason: '',
  pendingRetry: null,

  setMode: (mode: AIMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    set({ mode });
  },

  setIsOffline: (isOffline: boolean) => {
    set({ isOffline });
  },

  getEffectiveProvider: () => {
    const { mode, isOffline } = get();
    // If user is offline, ALWAYS use local AI. Otherwise use selected mode.
    if (isOffline) return 'local';
    return mode;
  },

  checkOllamaHealth: async () => {
    set((state) => ({
      ollamaStatus: { ...state.ollamaStatus, checking: true },
    }));
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await axios.get(`${baseUrl}/health/ollama`, { timeout: 4000 });
      const data = res.data;
      set({
        ollamaStatus: {
          running: !!data.running,
          modelReady: !!data.model_installed,
          checking: false,
          modelConfigured: data.model_configured || 'qwen2.5:7b',
          models: data.models || [],
          error: data.error,
          message: data.message,
        },
      });
    } catch (err: any) {
      set({
        ollamaStatus: {
          running: false,
          modelReady: false,
          checking: false,
          modelConfigured: 'qwen2.5:7b',
          models: [],
          error: 'Could not contact SUITS backend or Ollama daemon.',
        },
      });
    }
  },

  triggerLimitModal: (reason = '', retryFn = undefined) => {
    set({
      showLimitModal: true,
      limitReason: reason || 'Online AI API rate limit or quota reached.',
      pendingRetry: retryFn || null,
    });
    // Kick off health check so the modal immediately displays Ollama's live status
    get().checkOllamaHealth();
  },

  closeLimitModal: () => {
    set({ showLimitModal: false, pendingRetry: null });
  },

  switchToLocalAndRetry: async () => {
    const retry = get().pendingRetry;
    get().setMode('local');
    set({ showLimitModal: false, pendingRetry: null });

    if (retry) {
      try {
        await retry();
      } catch (err) {
        console.error('Failed to retry operation with Local Ollama:', err);
      }
    }
  },
}));

// Set up browser online/offline listeners & initial health check
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useAIModeStore.getState().checkOllamaHealth();
  }, 200);

  window.addEventListener('online', () => {
    useAIModeStore.getState().setIsOffline(false);
  });
  window.addEventListener('offline', () => {
    useAIModeStore.getState().setIsOffline(true);
  });
}
