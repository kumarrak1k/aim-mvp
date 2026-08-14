/**
 * Everything that must be hidden before a marketing screenshot is taken.
 *
 * This lived as seven near-identical copies across the capture specs, which is
 * why the support-chat launcher was never in any of them: it floats over the
 * bottom-right of every page and shipped sitting on top of the "Confidence"
 * score tile in the published feedback screenshot. One list now, so adding a
 * new floating element means fixing it in one place.
 */
export const HIDE_CHROME = `
  button[aria-label="Open Next.js Dev Tools"],
  nextjs-portal,
  [data-nextjs-toast],
  #__next-build-watcher,
  button[aria-label^="Chat with AI Career Mentor"],
  button[aria-label="Close chat"],
  div:has(> button[aria-label^="Chat with AI Career Mentor"]),
  div:has(> button[aria-label="Close chat"]),
  [role="dialog"][aria-label="Cookie and analytics notice"] { display: none !important; }
`;
