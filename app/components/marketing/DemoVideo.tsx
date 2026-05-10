type DemoVideoProps = {
  src?: string;
  title?: string;
  caption?: string;
};

export function DemoVideo({
  src,
  title = "AI Career Mentor — Product demo",
  caption = "A quick overview of AI Career Mentor — interview coaching for candidates and hiring teams.",
}: DemoVideoProps) {
  if (src) {
    return (
      <figure className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-purple-950/30">
        <div className="relative aspect-video bg-black">
          <video
            src={src}
            title={title}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full"
          />
        </div>
        {caption && (
          <figcaption className="border-t border-white/[0.07] bg-white/[0.03] px-5 py-3 text-center text-xs text-gray-500">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-purple-950/30">
      <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-purple-900/40 via-fuchsia-900/20 to-[#0a0614]">
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
        <figcaption className="border-t border-white/[0.07] bg-white/[0.03] px-5 py-3 text-center text-xs text-gray-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
