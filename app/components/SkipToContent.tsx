/**
 * "Skip to main content" link — the first focusable element on every shelled
 * page (WCAG 2.4.1 Bypass Blocks). Visually hidden until keyboard focus
 * reaches it, then presented as a clear pill above everything else.
 *
 * Every shell that renders this must give its <main> id="main-content".
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-[#140a26] focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      Skip to main content
    </a>
  );
}
