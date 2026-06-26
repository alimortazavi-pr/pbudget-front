"use client";

import { useCallback, useRef, useState } from "react";

type SpeechResult = {
  isFinal?: boolean;
  [index: number]: { transcript: string };
};

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: {
    results: { length: number; [index: number]: SpeechResult };
    resultIndex: number;
  }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type VoiceAssistantState = "idle" | "listening" | "processing";

export function useVoiceAssistant() {
  const [state, setState] = useState<VoiceAssistantState>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  const getRecognitionCtor = useCallback(() => {
    const Win = window as typeof window & {
      webkitSpeechRecognition?: SpeechRecognitionCtor;
      SpeechRecognition?: SpeechRecognitionCtor;
    };
    return Win.webkitSpeechRecognition ?? Win.SpeechRecognition ?? null;
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState("idle");
  }, []);

  const start = useCallback(
    (onFinal: (text: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        setError("مرورگر شما از تشخیص صدا پشتیبانی نمی‌کند");
        return;
      }

      setError(null);
      setInterimTranscript("");

      const rec = new Ctor();
      recognitionRef.current = rec;
      rec.lang = "fa-IR";
      rec.interimResults = true;
      rec.continuous = false;

      rec.onresult = (event) => {
        let interim = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const part = event.results[i]?.[0]?.transcript ?? "";
          if (event.results[i]?.isFinal) {
            finalText += part;
          } else {
            interim += part;
          }
        }

        if (interim) setInterimTranscript(interim);
        if (finalText.trim()) {
          setInterimTranscript(finalText.trim());
          onFinal(finalText.trim());
        }
      };

      rec.onerror = (event) => {
        if (event.error !== "aborted") {
          setError("خطا در تشخیص صدا — دوباره تلاش کنید");
        }
        setState("idle");
      };

      rec.onend = () => {
        if (recognitionRef.current === rec) {
          recognitionRef.current = null;
          setState((prev) => (prev === "listening" ? "idle" : prev));
        }
      };

      try {
        rec.start();
        setState("listening");
      } catch {
        setError("شروع ضبط صدا ممکن نشد");
        setState("idle");
      }
    },
    [getRecognitionCtor],
  );

  const setProcessing = useCallback((processing: boolean) => {
    setState(processing ? "processing" : "idle");
  }, []);

  return {
    state,
    interimTranscript,
    error,
    start,
    stop,
    setProcessing,
    setError,
    isSupported: typeof window !== "undefined" && !!getRecognitionCtor(),
  };
}
