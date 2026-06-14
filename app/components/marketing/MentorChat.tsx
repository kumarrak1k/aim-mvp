"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm your AI Mentor assistant. Ask me anything about the platform — getting started, what's included in each plan, or how a feature works. If I can't help, I'll point you to the right place.",
};

export function MentorChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const reply: string =
        data.reply ||
        data.error ||
        "Sorry, I couldn't get a response. Please try again or contact us.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Something went wrong. Please try again or email support@aicareermentor.co.uk",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div
          className="flex flex-col w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          style={{ height: "min(480px, calc(100dvh - 120px))", background: "#100922" }}
          role="dialog"
          aria-label="AI Mentor chat"
          aria-modal="false"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] shrink-0" style={{ background: "#150c2a" }}>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--brand-purple)" }}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-white">AI Mentor</span>
              <span className="text-xs text-gray-400 hidden sm:inline">· here to help</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded"
              aria-label="Close chat"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                <path d="M11.707 3.707a1 1 0 0 0-1.414-1.414L7 5.586 3.707 2.293a1 1 0 0 0-1.414 1.414L5.586 7l-3.293 3.293a1 1 0 1 0 1.414 1.414L7 8.414l3.293 3.293a1 1 0 0 0 1.414-1.414L8.414 7l3.293-3.293z" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "text-white"
                      : "text-gray-200 bg-white/[0.07]"
                  }`}
                  style={m.role === "user" ? { background: "var(--brand-purple)" } : undefined}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.07] rounded-xl px-3 py-3">
                  <span className="flex gap-1 items-center" aria-label="Typing…">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/[0.08] shrink-0" style={{ background: "#150c2a" }}>
            <form onSubmit={send} className="flex items-center gap-2 px-3 pt-2 pb-1">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(e as unknown as FormEvent);
                  }
                }}
                placeholder="Ask a question…"
                maxLength={500}
                disabled={loading}
                aria-label="Chat message"
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = `0 0 0 2px var(--brand-purple)`)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.08)")
                }
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: "var(--brand-purple)" }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="white" aria-hidden="true">
                  <path d="M6.5 0L12.124 5.5H8.5V13H4.5V5.5H0.876L6.5 0Z" />
                </svg>
              </button>
            </form>
            <p className="text-center text-[11px] text-gray-500 pb-2.5 px-3">
              Need more help?{" "}
              <Link href="/contact" className="text-gray-400 hover:text-white underline transition-colors">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with AI Mentor"}
        aria-expanded={open}
        className="w-14 h-14 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
        style={{ background: "var(--brand-purple)", boxShadow: "0 4px 20px rgba(168,85,247,0.45)" }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="white" aria-hidden="true">
            <path d="M16.707 2.707a1 1 0 0 0-1.414-1.414L9 7.586 2.707 1.293a1 1 0 0 0-1.414 1.414L7.586 9l-6.293 6.293a1 1 0 1 0 1.414 1.414L9 10.414l6.293 6.293a1 1 0 0 0 1.414-1.414L10.414 9l6.293-6.293z" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
