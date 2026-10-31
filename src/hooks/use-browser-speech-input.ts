"use client";

import { useEffect, useRef } from "react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export function useBrowserSpeechInput(input: {
  active: boolean;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}) {
  const callbacksRef = useRef(input);
  callbacksRef.current = input;

  useEffect(() => {
    if (!input.active) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      callbacksRef.current.onError?.(
        "Speech recognition is not supported in this browser. Try Chrome or Edge."
      );
      callbacksRef.current.onEnd?.();
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const piece = result[0]?.transcript ?? "";
        if (result.isFinal) finalChunk += piece;
        else interim += piece;
      }
      const text = (finalChunk || interim).trim();
      if (text) {
        callbacksRef.current.onTranscript(text, Boolean(finalChunk));
      }
    };

    recognition.onerror = () => {
      callbacksRef.current.onError?.(
        "Could not capture speech. Check microphone permissions and try again."
      );
    };

    recognition.onend = () => {
      callbacksRef.current.onEnd?.();
    };

    try {
      recognition.start();
    } catch {
      callbacksRef.current.onError?.("Microphone is unavailable or already in use.");
      callbacksRef.current.onEnd?.();
    }

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, [input.active]);
}
