"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Shot } from "./DemoShowcase";

/**
 * A product screenshot that opens full-size on click.
 *
 * Built on the native <dialog>: showModal() gives us the focus trap, inert
 * background and top-layer stacking from the platform, all of which are easy
 * to get subtly wrong by hand. If JS never loads the figure still renders as a
 * plain image, so nothing is lost.
 *
 * State sync deliberately does NOT depend on the dialog's own close/cancel
 * events. Every exit runs through dismiss(), and Escape is handled from
 * keydown with the default prevented, so React state and the DOM cannot drift
 * apart. They drifted in testing — the dialog closed while `open` stayed true,
 * which left the page unscrollable and the trigger dead on the next click.
 */
export function ShotFigure({
  shot,
  sizes,
  rounded = "rounded-2xl",
  priority = false,
  zoomable = true,
}: {
  shot: Shot;
  sizes: string;
  rounded?: string;
  priority?: boolean;
  /**
   * Set false where the shot already renders large enough to read, such as the
   * lead figure. Offering "enlarge" there promises a bigger view than the
   * lightbox can actually deliver.
   */
  zoomable?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setOpen(false);
  }, []);

  // Safety net for any exit path the component does not drive itself (a
  // browser-level dismissal, say). Idempotent with dismiss().
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => setOpen(false);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  // State drives the dialog, never the click handler, so the DOM cannot end up
  // disagreeing with `open`. Modal <dialog> also does not lock background
  // scrolling, hence the overflow handling; tying it to this effect means it is
  // released on whichever path closed the dialog.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    if (!dialog.open) dialog.showModal();
    closeButtonRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!zoomable) {
    return (
      <figure>
        <div className={`overflow-hidden ${rounded} ring-1 ring-white/10`}>
          <Image
            src={shot.src}
            alt={shot.alt}
            width={2600}
            height={1781}
            sizes={sizes}
            priority={priority}
            className="h-auto w-full"
          />
        </div>
        <figcaption className="mt-3 text-center text-sm leading-6 text-gray-400">
          {shot.caption}
        </figcaption>
      </figure>
    );
  }

  return (
    <figure>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge screenshot: ${shot.alt}`}
        className={`group relative block w-full cursor-zoom-in overflow-hidden ${rounded} ring-1 ring-white/10 transition hover:ring-purple-400/40 motion-reduce:transition-none`}
      >
        <Image
          src={shot.src}
          alt={shot.alt}
          width={2600}
          height={1781}
          sizes={sizes}
          priority={priority}
          className="h-auto w-full"
        />
        {/* Affordance only — the button already carries the accessible name. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-[12px] font-semibold text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5M11 8v6M8 11h6" />
          </svg>
          Enlarge
        </span>
      </button>

      <figcaption className="mt-3 text-center text-sm leading-6 text-gray-400">
        {shot.caption}
      </figcaption>

      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          dismiss();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            // Drive the close ourselves so it happens exactly once and state
            // follows, rather than letting the browser close it behind React.
            e.preventDefault();
            dismiss();
          }
        }}
        // The dialog element itself is the full-viewport surface, so a click
        // that lands on it rather than on the figure inside is a backdrop click.
        onClick={(e) => {
          if (e.target === dialogRef.current) dismiss();
        }}
        className="max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/85 backdrop:backdrop-blur-sm open:fixed open:inset-0 open:m-0 open:flex open:h-full open:w-full open:items-center open:justify-center"
      >
        {open && (
          <figure className="relative flex max-h-full w-full flex-col items-center gap-3 p-4 sm:p-8">
            <Image
              src={shot.src}
              alt={shot.alt}
              width={2600}
              height={1781}
              sizes="100vw"
              className="h-auto max-h-[82vh] w-auto max-w-full rounded-lg object-contain"
            />
            <figcaption className="max-w-2xl text-center text-sm leading-6 text-gray-300">
              {shot.caption}
            </figcaption>

            <button
              type="button"
              ref={closeButtonRef}
              onClick={dismiss}
              aria-label="Close enlarged screenshot"
              className="absolute top-6 right-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 motion-reduce:transition-none sm:top-10 sm:right-10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </figure>
        )}
      </dialog>
    </figure>
  );
}
