import { useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLegalSpeechRecognition } from "@/hooks/useLegalSpeechRecognition";
import { SiriLegalVisualizer } from "./SiriLegalVisualizer";
import { useDictationStore } from "@/store/dictation-store";
import { LegalCorrection } from "@/lib/dictation/legalCorrectionEngine";

export function GlobalVoiceDictation() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    caseQueryHandler,
    setPendingFullScreenPrompt,
    setIsDictating,
    setAudioLevel: setStoreAudioLevel,
    setInterimText: setStoreInterimText,
    addRecentCorrections,
  } = useDictationStore();

  const isAltHoldingRef = useRef(false);
  const locationRef = useRef(location);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Handle finalized transcription
  const handleFinalTranscript = useCallback(
    (text: string, corrections: LegalCorrection[]) => {
      const query = text.trim();
      if (!query) return;

      if (corrections.length > 0) {
        addRecentCorrections(corrections);
      }

      const currentPath = locationRef.current.pathname;

      // Scenario A: User is currently on an open case dashboard (/case/:cnr)
      if (currentPath.startsWith("/case/")) {
        const handler = useDictationStore.getState().caseQueryHandler;
        if (handler) {
          // Open mini-form chatbot and stream AI response immediately
          handler(query);
          return;
        }
      }

      // Scenario B: User has not opened any case (/dashboard, /search, /research, etc.)
      // Navigate to full-screen legal chat and stream AI response immediately
      setPendingFullScreenPrompt(query);
      navigate("/chat", { state: { autoPrompt: query } });
    },
    [addRecentCorrections, navigate, setPendingFullScreenPrompt]
  );

  const {
    isSupported,
    isListening,
    interimText,
    audioLevel,
    startListening,
    stopListening,
    cancelListening,
  } = useLegalSpeechRecognition({
    onFinalTranscript: handleFinalTranscript,
    enableChime: true,
  });

  // Sync state to store
  useEffect(() => {
    setIsDictating(isListening);
  }, [isListening, setIsDictating]);

  useEffect(() => {
    setStoreAudioLevel(audioLevel);
  }, [audioLevel, setStoreAudioLevel]);

  useEffect(() => {
    setStoreInterimText(interimText);
  }, [interimText, setStoreInterimText]);

  // Global Alt key Push-to-Talk listener across entire application
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        e.preventDefault();
        if (e.repeat) return; // Prevent repeated triggers while held

        if (!isListening && isSupported) {
          isAltHoldingRef.current = true;
          startListening();
        }
      }
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        if (isAltHoldingRef.current) {
          isAltHoldingRef.current = false;
          stopListening();
        }
      }
    };

    const handleWindowBlur = () => {
      if (isAltHoldingRef.current) {
        isAltHoldingRef.current = false;
        cancelListening();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("keyup", handleGlobalKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("keyup", handleGlobalKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isListening, isSupported, startListening, stopListening, cancelListening]);

  return (
    <SiriLegalVisualizer
      isListening={isListening}
      audioLevel={audioLevel}
      interimText={interimText}
    />
  );
}
