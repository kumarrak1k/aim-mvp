"use client";

import { useEffect, useRef, useState } from "react";
import { MentorScene } from "./mentor-scene";
import { createLipSyncTimeline } from "@/lib/avatar/lip-sync-controller";

type MentorPlayerProps = {
  text: string;
  enabled: boolean;
  autoplay?: boolean;
  onFinished?: () => void;
};

export function MentorPlayer({
  text,
  enabled,
  autoplay = true,
  onFinished,
}: MentorPlayerProps) {
  const [speaking, setSpeaking] = useState(false);
  const [visemeWeights, setVisemeWeights] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("Ready");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timelineRef = useRef<Array<{ time: number; weights: Record<string, number> }>>([]);
  const rafRef = useRef<number | null>(null);
  const lastPlayedTextRef = useRef("");

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    setSpeaking(false);
    setVisemeWeights({});
    setStatus("Ready");
  };

  const runLipSyncLoop = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const loop = () => {
      const currentMs = audio.currentTime * 1000;
      let currentWeights: Record<string, number> = {};

      for (const frame of timelineRef.current) {
        if (frame.time <= currentMs) {
          currentWeights = frame.weights;
        } else {
          break;
        }
      }

      setVisemeWeights(currentWeights);

      if (!audio.paused && !audio.ended) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  const playWithBrowserSpeech = (inputText: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !inputText.trim()) {
      setStatus("Speech not supported");
      return;
    }

    stopPlayback();
    setStatus("Speaking");
    setSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(inputText);
    utterance.lang = "en-GB";
    utterance.rate = 1;
    utterance.pitch = 0.95;
    utterance.volume = 1;

    const animateMouth = () => {
      setVisemeWeights({
        viseme_aa: 0.45 + Math.random() * 0.25,
      });
    };

    const interval = window.setInterval(animateMouth, 120);

    utterance.onend = () => {
      window.clearInterval(interval);
      setSpeaking(false);
      setVisemeWeights({});
      setStatus("Ready");
      onFinished?.();
    };

    utterance.onerror = () => {
      window.clearInterval(interval);
      setSpeaking(false);
      setVisemeWeights({});
      setStatus("Speech failed");
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const playWithAzure = async (inputText: string) => {
    const res = await fetch("/api/avatar-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: inputText }),
    });

    const data = (await res.json()) as {
      audioBase64?: string;
      visemes?: Array<{ offsetMs: number; visemeId: number }>;
      error?: string;
    };

    if (!res.ok || !data.audioBase64 || !data.visemes) {
      throw new Error(data.error || "Azure avatar speech failed.");
    }

    timelineRef.current = createLipSyncTimeline(data.visemes);

    const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
    audioRef.current = audio;

    audio.onplay = () => {
      setSpeaking(true);
      setStatus("Speaking");
      runLipSyncLoop();
    };

    audio.onended = () => {
      setSpeaking(false);
      setVisemeWeights({});
      setStatus("Ready");
      onFinished?.();
    };

    audio.onerror = () => {
      setSpeaking(false);
      setVisemeWeights({});
      setStatus("Speech playback failed");
    };

    await audio.play();
  };

  const playText = async (inputText: string) => {
    if (!enabled || !inputText.trim()) return;

    stopPlayback();
    setStatus("Generating speech");

    try {
      await playWithAzure(inputText);
    } catch {
      setStatus("Using browser speech");
      playWithBrowserSpeech(inputText);
    }
  };

  useEffect(() => {
    if (
      autoplay &&
      enabled &&
      text.trim() &&
      text !== lastPlayedTextRef.current
    ) {
      lastPlayedTextRef.current = text;
      void playText(text);
    }

    return () => {
      stopPlayback();
    };
  }, [text, enabled, autoplay]);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-gray-950 via-gray-900 to-black p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-white">3D Mentor</p>
          <p className="text-sm text-gray-400">{status}</p>
        </div>

        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          {speaking ? "Speaking" : "Idle"}
        </div>
      </div>

      <MentorScene speaking={speaking} visemeWeights={visemeWeights} />

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => void playText(text)}
          disabled={!enabled || !text.trim()}
          className="flex-1 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Play Question
        </button>

        <button
          type="button"
          onClick={stopPlayback}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Stop
        </button>
      </div>
    </div>
  );
}