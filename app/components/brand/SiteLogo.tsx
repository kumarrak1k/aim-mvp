"use client";

import Link from "next/link";

type SiteLogoProps = {
  href?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  textClassName?: string;
};

const sizeClasses = {
  sm: {
    shell: "h-[1.45cm] w-[1.45cm] rounded-[0.95rem] sm:h-[1.65cm] sm:w-[1.65cm] sm:rounded-[1.05rem]",
    inner: "rounded-[0.82rem] sm:rounded-[0.9rem]",
    image: "h-full w-full rounded-[0.72rem] sm:rounded-[0.8rem]",
    title: "text-sm sm:text-base",
    subtitle: "text-[10px] sm:text-[11px]",
    zoom: 1.12,
  },
  md: {
    shell: "h-[1.5cm] w-[1.5cm] rounded-[1rem] sm:h-[2cm] sm:w-[2cm] sm:rounded-[1.35rem]",
    inner: "rounded-[0.84rem] sm:rounded-[1.08rem]",
    image: "h-full w-full rounded-[0.75rem] sm:rounded-[0.95rem]",
    title: "text-sm sm:text-lg",
    subtitle: "text-[10px] sm:text-xs",
    zoom: 1.12,
  },
  lg: {
    shell: "h-[1.75cm] w-[1.75cm] rounded-[1.15rem] sm:h-[2.2cm] sm:w-[2.2cm] sm:rounded-[1.5rem]",
    inner: "rounded-[0.95rem] sm:rounded-[1.2rem]",
    image: "h-full w-full rounded-[0.85rem] sm:rounded-[1.05rem]",
    title: "text-base sm:text-xl",
    subtitle: "text-[11px] sm:text-sm",
    zoom: 1.12,
  },
  xl: {
    shell: "h-[2cm] w-[2cm] rounded-[1.35rem] sm:h-[2.5cm] sm:w-[2.5cm] sm:rounded-[1.8rem]",
    inner: "rounded-[1.08rem] sm:rounded-[1.45rem]",
    image: "h-full w-full rounded-[0.95rem] sm:rounded-[1.25rem]",
    title: "text-lg sm:text-2xl",
    subtitle: "text-xs sm:text-sm",
    zoom: 1.12,
  },
};

function LogoContent({
  showText,
  size,
  className,
  textClassName,
}: Required<Pick<SiteLogoProps, "showText" | "size">> &
  Pick<SiteLogoProps, "className" | "textClassName">) {
  const styles = sizeClasses[size];

  return (
    <div className={`flex min-w-0 items-center gap-2 sm:gap-3 ${className || ""}`}>
      <div className="relative shrink-0">
        <div className="absolute -inset-1.5 rounded-[1.8rem] bg-purple-500/22 blur-lg" />

        <div
          className={`relative flex items-center justify-center overflow-hidden border border-white/15 bg-gradient-to-br from-white/14 via-white/7 to-purple-300/10 shadow-xl shadow-purple-950/35 ring-1 ring-purple-200/10 ${styles.shell}`}
        >
          <div
            className={`relative flex h-[92%] w-[92%] items-center justify-center overflow-hidden bg-white shadow-inner shadow-black/10 ${styles.inner}`}
          >
            <img
              src="/brand/logo.jpg"
              alt="AI Career Mentor"
              className={`${styles.image} object-contain`}
              style={{
                transform: `scale(${styles.zoom})`,
                transformOrigin: "center",
              }}
            />
          </div>
        </div>
      </div>

      {showText && (
        <div className={`min-w-[132px] sm:min-w-0 ${textClassName || ""}`}>
          <p
            className={`whitespace-nowrap font-black leading-tight tracking-[-0.04em] text-white ${styles.title}`}
          >
            AI Career Mentor
          </p>
          <p
            className={`hidden whitespace-nowrap font-medium text-purple-100/65 sm:block ${styles.subtitle}`}
          >
            Interview coaching platform
          </p>
        </div>
      )}
    </div>
  );
}

export function SiteLogo({
  href = "/",
  showText = true,
  size = "md",
  className = "",
  textClassName = "",
}: SiteLogoProps) {
  const content = (
    <LogoContent
      showText={showText}
      size={size}
      className={className}
      textClassName={textClassName}
    />
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block min-w-0 shrink-0">
      {content}
    </Link>
  );
}