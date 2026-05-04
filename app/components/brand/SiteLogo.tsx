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
    shell: "h-[1.65cm] w-[1.65cm] rounded-[1.05rem]",
    inner: "rounded-[0.9rem]",
    image: "h-full w-full rounded-[0.8rem]",
    title: "text-base",
    subtitle: "text-[11px]",
    zoom: 1.12,
  },
  md: {
    shell: "h-[2cm] w-[2cm] rounded-[1.35rem]",
    inner: "rounded-[1.08rem]",
    image: "h-full w-full rounded-[0.95rem]",
    title: "text-base sm:text-lg",
    subtitle: "text-xs",
    zoom: 1.12,
  },
  lg: {
    shell: "h-[2.2cm] w-[2.2cm] rounded-[1.5rem]",
    inner: "rounded-[1.2rem]",
    image: "h-full w-full rounded-[1.05rem]",
    title: "text-xl",
    subtitle: "text-sm",
    zoom: 1.12,
  },
  xl: {
    shell: "h-[2.5cm] w-[2.5cm] rounded-[1.8rem]",
    inner: "rounded-[1.45rem]",
    image: "h-full w-full rounded-[1.25rem]",
    title: "text-2xl",
    subtitle: "text-sm",
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
    <div className={`flex min-w-0 items-center gap-3 ${className || ""}`}>
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
        <div className={`min-w-0 ${textClassName || ""}`}>
          <p
            className={`truncate font-black tracking-[-0.04em] text-white ${styles.title}`}
          >
            AI Career Mentor
          </p>
          <p
            className={`truncate font-medium text-purple-100/65 ${styles.subtitle}`}
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
    <Link href={href} className="block min-w-0">
      {content}
    </Link>
  );
}