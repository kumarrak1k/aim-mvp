import Link from "next/link";
import Image from "next/image";

/**
 * The brand lockup — the full name at every width.
 *
 * The lockup is 2.75:1, so at a 40px header it is ~110px wide. Against 358px
 * of usable width on a 390px phone (and 288px on a 320px one) it sits
 * comfortably beside the 92px "Start free" button, so there is no width at
 * which the name has to be dropped. The mark-only asset is kept for the
 * favicon, app icons and tight in-app furniture.
 *
 * SVG with a transparent ground: no white plate to sit the artwork on, and no
 * raster to go soft on a retina display. The old /brand/logo.jpg was a 148KB
 * photograph doing the job of a logo, a favicon and an OG image at once.
 */

type SiteLogoProps = {
  href?: string;
  /** Kept for call-site compatibility; the lockup carries the name itself. */
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  textClassName?: string;
};

/** Rendered heights: a touch smaller on phones, then the full size from sm. */
const sizes = {
  sm: { h: 30, cls: "h-[30px] sm:h-[34px]" },
  md: { h: 44, cls: "h-[38px] sm:h-[44px]" },
  lg: { h: 54, cls: "h-[44px] sm:h-[54px]" },
  xl: { h: 66, cls: "h-[52px] sm:h-[66px]" },
};

const RATIO = 2.75; // lockup viewBox is 426x155

function LogoContent({
  size,
  className,
}: Required<Pick<SiteLogoProps, "size">> & Pick<SiteLogoProps, "className">) {
  const { h, cls } = sizes[size];

  return (
    <span className={`flex min-w-0 shrink-0 items-center ${className || ""}`}>
      <Image
        src="/brand/logo-lockup.svg"
        alt="AI Career Mentor"
        width={Math.round(h * RATIO)}
        height={h}
        priority
        className={`w-auto ${cls}`}
      />
    </span>
  );
}

export function SiteLogo({
  href = "/",
  size = "md",
  className = "",
}: SiteLogoProps) {
  const content = <LogoContent size={size} className={className} />;

  if (!href) return content;

  return (
    <Link href={href} className="block min-w-0 shrink-0">
      {content}
    </Link>
  );
}
