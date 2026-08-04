"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Final onboarding step: verify microphone, camera and speakers before the
 * first session, so equipment problems surface here — with time to fix them —
 * rather than mid-interview.
 *
 * Deliberately NOT a hard gate (unlike competitors): typed-only practice is a
 * real mode (it is the whole Free tier), so a candidate who declines camera
 * permission or has no webcam must still be able to continue. The primary
 * button rewards a full pass; the quiet link underneath always works.
 *
 * Media discipline: every stream is stopped on unmount and before navigation.
 * The mid-session media-release rules apply here too — nothing may keep the
 * mic or camera open after the user leaves this screen.
 */

type CheckState = "idle" | "checking" | "pass" | "fail";

const HINTS: Record<"mic" | "cam" | "spk", string> = {
  mic: "Check the browser's permission prompt (padlock icon in the address bar) and that the right microphone is selected in your system settings.",
  cam: "Check the browser's permission prompt (padlock icon in the address bar), and that no other app is using the camera.",
  spk: "Check your volume is up and the right output device is selected, then play it again.",
};

function StatusChip({ state }: { state: CheckState }) {
  if (state === "pass")
    return (
      <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
        Working
      </span>
    );
  if (state === "fail")
    return (
      <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[11px] font-bold text-amber-200">
        Problem
      </span>
    );
  if (state === "checking")
    return (
      <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-gray-300">
        Testing…
      </span>
    );
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-gray-500">
      Not tested
    </span>
  );
}

export function EquipmentCheck({
  onContinue,
  onBack,
}: {
  onContinue: () => void;
  onBack: () => void;
}) {
  const [mic, setMic] = useState<CheckState>("idle");
  const [cam, setCam] = useState<CheckState>("idle");
  const [spk, setSpk] = useState<CheckState>("idle");
  const [spkPlayed, setSpkPlayed] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const micStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  function stopAllMedia() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }

  // Release everything if the user navigates away by any route.
  useEffect(() => stopAllMedia, []);

  async function testMic() {
    setMic("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setMicLevel(rms);
        // Any clear signal counts as a pass — the meter keeps animating so the
        // user can see it responding to their voice.
        if (rms > 0.04) setMic("pass");
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setMic("fail");
    }
  }

  async function testCam() {
    setCam("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      camStreamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
      // Frames arriving = camera genuinely works.
      const started = Date.now();
      const poll = () => {
        if (video && video.videoWidth > 0) {
          setCam("pass");
          return;
        }
        if (Date.now() - started > 8000) {
          setCam("fail");
          return;
        }
        setTimeout(poll, 200);
      };
      poll();
    } catch {
      setCam("fail");
    }
  }

  function playTestSound() {
    try {
      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;
      // Two gentle notes — clearly deliberate, nothing like a notification.
      const now = ctx.currentTime;
      [523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.0001, now + i * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.35 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.35 + 0.32);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.35);
        osc.stop(now + i * 0.35 + 0.35);
      });
      setSpkPlayed(true);
    } catch {
      setSpk("fail");
    }
  }

  const allPass = mic === "pass" && cam === "pass" && spk === "pass";

  function leave(fn: () => void) {
    stopAllMedia();
    fn();
  }

  const ROW =
    "rounded-[1.25rem] border border-white/[0.08] bg-white/[0.03] p-5";
  const BTN_SMALL =
    "rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.1]";

  return (
    <section>
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Quick equipment check
      </h1>
      <p className="mt-3 text-sm leading-7 text-gray-400">
        Thirty seconds now saves a session lost to a muted mic. Voice and camera
        coaching need these — typed practice works without them.
      </p>

      <div className="mt-7 space-y-3">
        {/* Microphone */}
        <div className={ROW}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-white">Microphone</p>
            <StatusChip state={mic} />
          </div>
          {mic === "idle" && (
            <button onClick={testMic} className={`${BTN_SMALL} mt-3`}>
              Test microphone
            </button>
          )}
          {(mic === "checking" || mic === "pass") && (
            <div className="mt-3">
              <p className="text-xs text-gray-400">
                {mic === "pass"
                  ? "Heard you clearly."
                  : "Say something — “testing, one two three” works."}
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-emerald-400/80 transition-[width] duration-75"
                  style={{ width: `${Math.min(100, Math.round(micLevel * 260))}%` }}
                />
              </div>
            </div>
          )}
          {mic === "fail" && (
            <div className="mt-3">
              <p className="text-xs leading-5 text-amber-200/90">{HINTS.mic}</p>
              <button onClick={testMic} className={`${BTN_SMALL} mt-2`}>
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Camera */}
        <div className={ROW}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-white">Camera</p>
            <StatusChip state={cam} />
          </div>
          {cam === "idle" && (
            <button onClick={testCam} className={`${BTN_SMALL} mt-3`}>
              Test camera
            </button>
          )}
          <div className={cam === "checking" || cam === "pass" ? "mt-3" : "hidden"}>
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-36 w-48 rounded-xl border border-white/10 bg-black object-cover"
            />
            {cam === "pass" && (
              <p className="mt-2 text-xs text-gray-400">Looking good.</p>
            )}
          </div>
          {cam === "fail" && (
            <div className="mt-3">
              <p className="text-xs leading-5 text-amber-200/90">{HINTS.cam}</p>
              <button onClick={testCam} className={`${BTN_SMALL} mt-2`}>
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Speakers */}
        <div className={ROW}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-white">Speakers or headphones</p>
            <StatusChip state={spk} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={playTestSound} className={BTN_SMALL}>
              {spkPlayed ? "Play it again" : "Play test sound"}
            </button>
            {spkPlayed && spk !== "pass" && (
              <>
                <button
                  onClick={() => setSpk("pass")}
                  className={`${BTN_SMALL} !border-emerald-300/25 !bg-emerald-300/10 text-emerald-200`}
                >
                  I heard it
                </button>
                <button
                  onClick={() => setSpk("fail")}
                  className={`${BTN_SMALL} text-gray-400`}
                >
                  I didn&rsquo;t hear anything
                </button>
              </>
            )}
          </div>
          {spk === "fail" && (
            <p className="mt-3 text-xs leading-5 text-amber-200/90">{HINTS.spk}</p>
          )}
        </div>
      </div>

      <div className="mt-9 flex flex-col items-center gap-3">
        <button
          onClick={() => leave(onContinue)}
          disabled={!allPass}
          className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] disabled:opacity-35 disabled:hover:scale-100"
        >
          Everything works — let&rsquo;s go →
        </button>
        <button
          onClick={() => leave(onContinue)}
          className="text-sm font-bold text-gray-400 transition hover:text-white"
        >
          Skip the check — I&rsquo;ll practise typed for now
        </button>
        <button
          onClick={() => leave(onBack)}
          className="text-xs font-bold text-gray-600 transition hover:text-gray-400"
        >
          ← Back
        </button>
      </div>
    </section>
  );
}
