/**
 * Everything that must be hidden before a marketing screenshot is taken.
 *
 * This lived as seven near-identical copies across the capture specs, which is
 * why the support-chat launcher was never in any of them: it floats over the
 * bottom-right of every page and shipped sitting on top of the "Confidence"
 * score tile. One list now, so adding a new floating element means fixing it
 * in one place.
 *
 * Prefer `data-capture-hide` on the component over matching an aria-label.
 * Labels are translated on aicareermentor.com, so an English selector silently
 * missed fr/de/es there and the launcher survived into those screenshots. The
 * attribute keeps one selector working across both sites and every locale.
 */
export const HIDE_CHROME = `
  [data-capture-hide],
  button[aria-label="Open Next.js Dev Tools"],
  nextjs-portal,
  [data-nextjs-toast],
  #__next-build-watcher { display: none !important; }
`;
