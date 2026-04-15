"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MentorAvatarProps = {
  question: string;
  speakerEnabled: boolean;
  hasUserInteracted: boolean;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onAutoListen?: () => void;
  autoStartListening?: boolean;
};

export function MentorAvatar({
  question,
  speakerEnabled,
  hasUserInteracted,
  onSpeechStart,
  onSpeechEnd,
  onAutoListen,
  autoStartListening = true,
}: MentorAvatarProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0.18);
  const [currentStatus, setCurrentStatus] = useState("Ready");
  const [voiceReady, setVoiceReady] = useState(false);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const lastSpokenQuestionRef = useRef("");
  const animationFrameRef = useRef<number | null>(null);
  const fallbackIntervalRef = useRef<number | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
      if (voicesRef.current.length > 0) {
        setVoiceReady(true);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;

      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      if (fallbackIntervalRef.current) {
        window.clearInterval(fallbackIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      !speakerEnabled ||
      !hasUserInteracted ||
      !question.trim() ||
      question === lastSpokenQuestionRef.current
    ) {
      return;
    }

    speakQuestion(question, autoStartListening);
    lastSpokenQuestionRef.current = question;
  }, [question, speakerEnabled, hasUserInteracted, autoStartListening]);

  const getPreferredMentorVoice = () => {
    const voices = voicesRef.current;

    const preferredNames = [
      "Daniel",
      "Google UK English Male",
      "Microsoft Ryan Online (Natural)",
      "Thomas",
      "Nathan",
      "Oliver",
      "George",
      "Arthur",
      "Fred",
      "Serena",
      "Sonia",
      "Libby",
      "Emma",
    ];

    for (const name of preferredNames) {
      const match = voices.find(
        (voice) =>
          voice.name.toLowerCase().includes(name.toLowerCase()) &&
          voice.lang.toLowerCase().startsWith("en")
      );
      if (match) return match;
    }

    const british = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en-gb")
    );
    if (british) return british;

    const english = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en")
    );
    if (english) return english;

    return voices[0];
  };

  const stopMouthAnimation = () => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (fallbackIntervalRef.current) {
      window.clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }

    setMouthOpen(0.18);
  };

  const startFallbackMouthAnimation = () => {
    stopMouthAnimation();

    fallbackIntervalRef.current = window.setInterval(() => {
      setMouthOpen((previous) => {
        const next = 0.18 + Math.random() * 0.45;
        return Math.abs(previous - next) < 0.08 ? next + 0.12 : next;
      });
    }, 110);
  };

  const pulseIdleMouth = () => {
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;

      const idleValue = 0.16 + Math.sin(elapsed * 2.4) * 0.015;
      setMouthOpen(idleValue);

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!isSpeaking) {
      stopMouthAnimation();
      pulseIdleMouth();
    } else {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isSpeaking]);

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    activeUtteranceRef.current = null;
    setIsSpeaking(false);
    setCurrentStatus("Ready");
    stopMouthAnimation();
    setMouthOpen(0.18);
    onSpeechEnd?.();
  };

  const speakQuestion = (text: string, shouldAutoListen: boolean) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) {
      if (shouldAutoListen) {
        onAutoListen?.();
      }
      return;
    }

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtteranceRef.current = utterance;

    utterance.rate = 0.96;
    utterance.pitch = 0.88;
    utterance.volume = 1;
    utterance.lang = "en-GB";

    const selectedVoice = getPreferredMentorVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentStatus("Asking your question");
      onSpeechStart?.();
      startFallbackMouthAnimation();
    };

    utterance.onboundary = () => {
      setMouthOpen(0.58);

      window.setTimeout(() => {
        setMouthOpen(0.24);
      }, 70);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentStatus("Ready");
      stopMouthAnimation();
      setMouthOpen(0.18);
      onSpeechEnd?.();

      if (shouldAutoListen) {
        onAutoListen?.();
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentStatus("Ready");
      stopMouthAnimation();
      setMouthOpen(0.18);
      onSpeechEnd?.();

      if (shouldAutoListen) {
        onAutoListen?.();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const auraClass = useMemo(() => {
    return isSpeaking ? "opacity-100 scale-100" : "opacity-60 scale-95";
  }, [isSpeaking]);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-gray-950 via-gray-900 to-black p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Mentor Mode</p>
          <p className="text-sm text-gray-400">
            {speakerEnabled ? currentStatus : "Text-only mode is enabled"}
          </p>
        </div>

        <div className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
          {voiceReady ? "Voice ready" : "Loading voice"}
        </div>
      </div>

      <div className="relative mx-auto flex aspect-[4/5] w-full max-w-[320px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_35%),linear-gradient(180deg,#0b0b12_0%,#09090f_100%)]">
        <div
          className={`absolute inset-0 bg-[radial-gradient(circle,rgba(124,58,237,0.22),transparent_55%)] transition duration-300 ${auraClass}`}
        />

        <img
          src="/mentor/obiwan-experiment.png"
          alt="Mentor avatar"
          className="relative z-10 h-full w-full object-cover"
        />

        <div className="pointer-events-none absolute inset-0 z-20">
          <div
            className="absolute left-1/2 top-[71.5%] -translate-x-1/2 rounded-full bg-[#24130f] shadow-[0_0_18px_rgba(0,0,0,0.45)] transition-all duration-75"
            style={{
              width: "13.5%",
              height: `${mouthOpen * 12}%`,
              minHeight: "6px",
              maxHeight: "30px",
              borderRadius: "999px",
            }}
          />

          <div
            className="absolute left-1/2 top-[70.8%] -translate-x-1/2 rounded-full border border-[#5f3a2f]/60"
            style={{
              width: "15%",
              height: `${Math.max(0.8, mouthOpen * 14)}%`,
              opacity: isSpeaking ? 0.9 : 0.45,
            }}
          />
        </div>

        {isSpeaking && (
          <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
            Speaking
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => speakQuestion(question, autoStartListening)}
          disabled={!speakerEnabled || !question.trim()}
          className="flex-1 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Play Mentor Question
        </button>

        <button
          type="button"
          onClick={stopSpeaking}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Stop
        </button>
      </div>
    </div>
  );
}