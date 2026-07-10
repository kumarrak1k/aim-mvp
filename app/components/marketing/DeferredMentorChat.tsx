"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Code-split the chat widget out of the initial bundle and mount it only
// once the browser is idle (or after a short fallback delay). The widget sits
// in a corner and is never part of the first paint, so keeping its JS off the
// critical path improves LCP without changing anything a user can see.
const MentorChat = dynamic(
  () => import("./MentorChat").then((m) => m.MentorChat),
  { ssr: false }
);

export function DeferredMentorChat() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setReady(true), {
        timeout: 4000,
      });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(() => setReady(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return ready ? <MentorChat /> : null;
}
