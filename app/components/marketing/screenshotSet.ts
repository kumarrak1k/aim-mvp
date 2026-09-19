/**
 * The published product-screenshot set.
 *
 * Each re-capture is published into a new folder rather than over the old
 * files: the image optimiser (and Vercel's CDN) cache by URL, so a file
 * replaced in place kept serving the previous screenshot. Bump this when
 * scripts/frame-screenshots.mjs publishes a new set; the script reads the
 * value from here, so the two cannot disagree.
 */
export const SCREENSHOT_SET = "2026-09-19";

/** The dark (default) version of a published screenshot. */
export function shotSrc(name: string): string {
  return `/marketing/${SCREENSHOT_SET}/${name}.webp`;
}
