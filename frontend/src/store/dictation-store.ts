import { create } from "zustand";
import { LegalCorrection } from "@/lib/dictation/legalCorrectionEngine";

interface DictationState {
  isDictating: boolean;
  audioLevel: number;
  interimText: string;
  recentCorrections: LegalCorrection[];
  caseQueryHandler: ((query: string) => void) | null;
  pendingFullScreenPrompt: string | null;

  setIsDictating: (isDictating: boolean) => void;
  setAudioLevel: (audioLevel: number) => void;
  setInterimText: (interimText: string) => void;
  setRecentCorrections: (corrections: LegalCorrection[]) => void;
  addRecentCorrections: (corrections: LegalCorrection[]) => void;
  registerCaseQueryHandler: (handler: ((query: string) => void) | null) => void;
  setPendingFullScreenPrompt: (prompt: string | null) => void;
}

export const useDictationStore = create<DictationState>((set) => ({
  isDictating: false,
  audioLevel: 0,
  interimText: "",
  recentCorrections: [],
  caseQueryHandler: null,
  pendingFullScreenPrompt: null,

  setIsDictating: (isDictating) => set({ isDictating }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setInterimText: (interimText) => set({ interimText }),
  setRecentCorrections: (recentCorrections) => set({ recentCorrections }),
  addRecentCorrections: (corrections) =>
    set((state) => ({
      recentCorrections: [...state.recentCorrections, ...corrections].slice(-5),
    })),
  registerCaseQueryHandler: (caseQueryHandler) => set({ caseQueryHandler }),
  setPendingFullScreenPrompt: (pendingFullScreenPrompt) =>
    set({ pendingFullScreenPrompt }),
}));
