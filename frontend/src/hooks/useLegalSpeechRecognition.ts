import { useState, useRef, useEffect, useCallback } from "react";
import { correctLegalSpeech, LegalCorrection } from "@/lib/dictation/legalCorrectionEngine";
import { playSiriActivationChime, playSiriDeactivationChime } from "@/lib/dictation/siriChime";
import "@/types/speech.d.ts";

interface UseLegalSpeechRecognitionOptions {
  onFinalTranscript?: (text: string, corrections: LegalCorrection[]) => void;
  lang?: string;
  enableChime?: boolean;
}

export function useLegalSpeechRecognition({
  onFinalTranscript,
  lang = "en-IN",
  enableChime = true,
}: UseLegalSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [recentCorrections, setRecentCorrections] = useState<LegalCorrection[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check browser support
  const isSupported = typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isExplicitStopRef = useRef<boolean>(false);
  const interimTextRef = useRef<string>("");
  const committedRef = useRef<boolean>(false);

  // Keep interimTextRef synced
  useEffect(() => {
    interimTextRef.current = interimText;
  }, [interimText]);

  // Clean up AudioContext & MediaStream
  const cleanupAudioAnalyser = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Initialize Web Audio API Analyser for real-time waveform reactivity
  const startAudioAnalyser = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        // Normalize to 0..1 scale with sensitivity curve
        const normalized = Math.min(Math.max((avg - 10) / 70, 0), 1);
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch {
      // Audio analyser failure is non-fatal: the visualizer will use CSS fallback
      cleanupAudioAnalyser();
    }
  }, [cleanupAudioAnalyser]);

  const stopListening = useCallback(() => {
    isExplicitStopRef.current = true;

    if (enableChime) {
      playSiriDeactivationChime();
    }

    // If there is uncommitted interim text when stopping, commit it immediately
    const pendingInterim = interimTextRef.current.trim();
    if (pendingInterim && onFinalTranscript) {
      const { correctedText, corrections } = correctLegalSpeech(pendingInterim);
      if (corrections.length > 0) {
        setRecentCorrections((prev) => [...prev, ...corrections]);
      }
      committedRef.current = true;
      onFinalTranscript(correctedText, corrections);
      interimTextRef.current = "";
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition already stopped
      }
    }
    cleanupAudioAnalyser();
    setIsListening(false);
    setInterimText("");
  }, [cleanupAudioAnalyser, enableChime, onFinalTranscript]);

  const cancelListening = useCallback(() => {
    isExplicitStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Recognition already aborted
      }
    }
    cleanupAudioAnalyser();
    setIsListening(false);
    setInterimText("");
    setRecentCorrections([]);
  }, [cleanupAudioAnalyser]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    setError(null);
    setRecentCorrections([]);
    isExplicitStopRef.current = false;
    interimTextRef.current = "";
    committedRef.current = false;

    // Play Siri activation chime
    if (enableChime) {
      playSiriActivationChime();
    }

    // Start Audio Analyser for dynamic waveform
    await startAudioAnalyser();

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let currentInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const rawTranscript = result[0]?.transcript || "";

        if (result.isFinal) {
          // If stopListening already committed the interim text, skip this
          // browser-fired final event to prevent double submission.
          if (committedRef.current) {
            committedRef.current = false;
            interimTextRef.current = "";
            continue;
          }
          // Process final transcript through Indian Legal Vocabulary Auto-Correction
          const { correctedText, corrections } = correctLegalSpeech(rawTranscript);
          if (corrections.length > 0) {
            setRecentCorrections((prev) => [...prev, ...corrections]);
          }
          if (onFinalTranscript && correctedText.trim()) {
            onFinalTranscript(correctedText.trim(), corrections);
          }
          interimTextRef.current = "";
        } else {
          currentInterim += rawTranscript;
        }
      }

      // Provide live preview of interim speech with real-time corrections
      if (currentInterim.trim()) {
        const { correctedText } = correctLegalSpeech(currentInterim);
        setInterimText(correctedText);
      } else {
        setInterimText("");
      }
    };

    recognition.onerror = (event: any) => {
      const errType = event.error;
      if (errType === "no-speech") {
        // Continuous mode silence: continue listening gracefully
        return;
      }
      if (errType === "not-allowed" || errType === "permission-denied") {
        setError("Microphone permission was denied. Please allow microphone access in your browser settings.");
      } else if (errType === "network") {
        setError("Network error encountered during speech recognition.");
      } else if (errType !== "aborted") {
        setError(`Speech recognition error: ${errType}`);
      }

      cleanupAudioAnalyser();
      setIsListening(false);
    };

    recognition.onend = () => {
      cleanupAudioAnalyser();
      setIsListening(false);
      setInterimText("");
    };

    try {
      recognition.start();
    } catch {
      setError("Could not start speech recognition. Please check your microphone connection.");
      cleanupAudioAnalyser();
      setIsListening(false);
    }
  }, [isSupported, enableChime, lang, onFinalTranscript, startAudioAnalyser, cleanupAudioAnalyser]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isExplicitStopRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      cleanupAudioAnalyser();
    };
  }, [cleanupAudioAnalyser]);

  return {
    isSupported,
    isListening,
    interimText,
    audioLevel,
    recentCorrections,
    error,
    startListening,
    stopListening,
    cancelListening,
    toggleListening,
  };
}
