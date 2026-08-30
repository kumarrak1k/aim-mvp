import Image from "next/image";

type ScreenshotSlotProps = {
  src?: string;
  alt: string;
  caption?: string;
  aspectRatio?: "video" | "square" | "wide";
};

const aspectClasses = {
  video: "aspect-video",
  square: "aspect-square",
  wide: "aspect-[16/9]",
};

export function ScreenshotSlot({
  src,
  alt,
  caption,
  aspectRatio = "video",
}: ScreenshotSlotProps) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-purple-950/20">
      <div
        className={`relative ${aspectClasses[aspectRatio]} bg-gradient-to-br from-purple-900/30 via-fuchsia-900/10 to-background`}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(120,60,255,0.12),transparent)]" />
            <div className="relative flex flex-col items-center gap-3 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-purple-300/30">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <p className="text-xs text-gray-400">{alt}</p>
            </div>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="border-t border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-center text-xs text-gray-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
