"use client";

import { useRef, useState } from "react";

type DemoVideoProps = {
  src?: string;
  title?: string;
  caption?: string;
  poster?: string;
  /** WebVTT captions for the narration (the frames carry burned-in display
   *  captions; this track serves caption-preference and screen-reader users). */
  captionsSrc?: string;
  captionsLang?: string;
  captionsLabel?: string;
  /** Match the container to the file's aspect so a square advert fills the
   *  frame instead of sitting between black pillars in a 16:9 player. */
  aspect?: "video" | "square";
};

export function DemoVideo({
  src,
  title = "AI Career Mentor: Product demo",
  caption = "A quick overview of AI Career Mentor, interview coaching that helps you land your next role.",
  poster,
  captionsSrc,
  captionsLang = "en",
  captionsLabel = "English",
  aspect = "video",
}: DemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Before the first play the whole surface starts the video, not just the
   * native control bar, and it shows its own play button: the poster is a
   * plain frame from the video (it used to be artwork with a "Start free"
   * button printed on it, which looked clickable and only played the video). A transparent overlay handles that first click and then
   * unmounts, leaving every later click to the browser's own play/pause
   * handling (attaching onClick to the video itself double-fires against
   * Chrome's native click-to-toggle).
   */
  const [started, setStarted] = useState(false);

  if (src) {
    return (
      <figure
        className={`mx-auto overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-purple-950/30 ${
          aspect === "square" ? "max-w-xl" : "max-w-4xl"
        }`}
      >
        <div
          className={`relative bg-black ${
            aspect === "square" ? "aspect-square" : "aspect-video"
          }`}
        >
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            title={title}
            controls
            playsInline
            onPlay={() => setStarted(true)}
            // "none": the poster is the pre-play visual, so no video bytes are
            // fetched until the user presses play. With the files on Vercel
            // Blob, preloading was silently burning data transfer per visit.
            preload="none"
            className="h-full w-full"
          >
            {captionsSrc && (
              <track
                kind="captions"
                src={captionsSrc}
                srcLang={captionsLang}
                label={captionsLabel}
              />
            )}
          </video>
          {!started && (
            <button
              type="button"
              aria-label="Play the demo video"
              onClick={() => void videoRef.current?.play()}
              className="group absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/10 transition hover:bg-black/20"
            >
              {/* Inline colours: it sits on video, not on the page, so it must
                  not follow the theme's remapping of white and violet. */}
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full shadow-2xl shadow-black/40 transition group-hover:scale-105 motion-reduce:transition-none"
                style={{ background: "rgba(255,255,255,0.94)" }}
              >
                <svg viewBox="0 0 24 24" fill="#6d28d9" aria-hidden="true" className="ml-1 h-7 w-7">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          )}
        </div>
        {caption && (
          <figcaption className="border-t border-white/[0.07] bg-white/[0.03] px-5 py-3 text-center text-xs text-gray-400">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-purple-950/30">
      <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-purple-900/40 via-fuchsia-900/20 to-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(120,60,255,0.15),transparent)]" />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-purple-300/20 bg-purple-500/20 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-purple-200">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-400">Product demo coming soon</p>
        </div>
      </div>
      {caption && (
        <figcaption className="border-t border-white/[0.07] bg-white/[0.03] px-5 py-3 text-center text-xs text-gray-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
