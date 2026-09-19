import Image from "next/image";
import { SCREENSHOT_SET } from "./screenshotSet";

/**
 * A product screenshot in the viewer's theme.
 *
 * Every published screenshot exists twice, in the current set folder (see
 * screenshotSet.ts): x.webp captured in dark and light/x.webp captured in light. Showing the
 * dark one on the light site looked like a different product, so both are
 * rendered and the theme classes show one (see globals.css).
 *
 * Both load lazily on purpose. The browser does not fetch a lazy image that
 * is display:none, so the hidden theme costs nothing; the visible one still
 * loads straight away when it is in the first screen, and fetchPriority keeps
 * it at the front of the queue where it matters (the homepage hero).
 */
export function lightVariant(src: string): string {
  const setFolder = `/marketing/${SCREENSHOT_SET}/`;
  return src.startsWith(setFolder) && !src.startsWith(`${setFolder}light/`)
    ? src.replace(setFolder, `${setFolder}light/`)
    : src;
}

export function ThemedShot({
  src,
  alt,
  sizes,
  className = "",
  highPriority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  /** The page's main image: fetch it ahead of everything else. */
  highPriority?: boolean;
}) {
  const common = {
    alt,
    width: 2600,
    height: 1781,
    sizes,
    loading: "lazy" as const,
    fetchPriority: highPriority ? ("high" as const) : undefined,
  };
  return (
    <>
      <Image src={src} {...common} className={`theme-dark-only ${className}`} />
      <Image src={lightVariant(src)} {...common} className={`theme-light-only ${className}`} />
    </>
  );
}
