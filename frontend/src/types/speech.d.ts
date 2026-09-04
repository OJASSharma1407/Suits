// Web Speech API TypeScript type declarations for Chromium and WebKit

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

export interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;

  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onaudiostart?: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onaudioend?: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onspeechstart?: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onspeechend?: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;

  start(): void;
  stop(): void;
  abort(): void;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
