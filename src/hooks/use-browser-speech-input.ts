"use client";

import { useEffect, useRef } from "react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
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

export async function requestMicrophoneAccess(): Promise<MediaStream | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

export function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export function useBrowserSpeechInput(input: {
  active: boolean;
  getSessionBaseText: () => string;
  onTranscript: (text: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}) {
  const callbacksRef = useRef(input);
  callbacksRef.current = input;
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const sessionFinalRef = useRef("");
  const activeRef = useRef(false);

  useEffect(() => {
    activeRef.current = input.active;
    if (!input.active) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      return;
    }

    sessionFinalRef.current = callbacksRef.current.getSessionBaseText().trim();
    let cancelled = false;

    const start = async () => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        callbacksRef.current.onError?.(
          "Speech recognition is not supported in this browser. Try Chrome or Edge."
        );
        callbacksRef.current.onEnd?.();
        return;
      }

      try {
        const stream = await requestMicrophoneAccess();
        if (cancelled || !activeRef.current) {
          stopMediaStream(stream);
          return;
        }
        if (!stream) {
          callbacksRef.current.onError?.("Microphone access is not available in this browser.");
          callbacksRef.current.onEnd?.();
          return;
        }
        streamRef.current = stream;
      } catch (err) {
        const denied =
          err instanceof DOMException &&
          (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
        callbacksRef.current.onError?.(
          denied
            ? "Microphone permission denied. Allow access in browser settings and try again."
            : "Could not open the microphone. Check device settings and try again."
        );
        callbacksRef.current.onEnd?.();
        return;
      }

      const recognition = new Ctor();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const piece = result[0]?.transcript ?? "";
          if (result.isFinal) {
            sessionFinalRef.current = `${sessionFinalRef.current} ${piece}`.trim();
          } else {
            interim += piece;
          }
        }
        const combined = `${sessionFinalRef.current}${interim ? ` ${interim}` : ""}`.trim();
        if (combined) {
          callbacksRef.current.onTranscript(combined);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "aborted" || event.error === "no-speech") return;
        callbacksRef.current.onError?.(
          event.error === "not-allowed"
            ? "Microphone permission denied."
            : "Speech capture failed. Check your microphone and try again."
        );
      };

      recognition.onend = () => {
        if (cancelled || !activeRef.current) {
          callbacksRef.current.onEnd?.();
          return;
        }
        try {
          recognition.start();
        } catch {
          callbacksRef.current.onEnd?.();
        }
      };

      try {
        recognition.start();
      } catch {
        callbacksRef.current.onError?.("Microphone is unavailable or already in use.");
        callbacksRef.current.onEnd?.();
      }
    };

    void start();

    return () => {
      cancelled = true;
      activeRef.current = false;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
  }, [input.active]);
}
