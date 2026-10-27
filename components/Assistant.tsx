"use client";

import { useState } from "react";

interface ChatLine {
  id: string;
  role: "user" | "assistant";
  body: string;
}

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function show() {
    setOpen(true);
    if (loaded) return;
    const response = await fetch("/api/chat");
    const data = await response.json();
    setLines(data.messages ?? []);
    setLoaded(true);
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (message.length < 2 || pending) return;
    setText("");
    setError("");
    setPending(true);
    setLines((current) => [...current, { id: `local-${Date.now()}`, role: "user", body: message }]);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Could not answer.");
      return;
    }
    setLines(data.messages ?? []);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <section className="flex h-[28rem] w-[min(100vw-2rem,22rem)] flex-col border border-line bg-cream shadow-card">
          <div className="flex items-center justify-between bg-brown px-4 py-3 text-cream">
            <div>
              <p className="font-serif text-xl leading-none">Ask Milla</p>
              <p className="mt-1 text-xs text-cream/70">Wallet, savings, and how to book.</p>
            </div>
            <button type="button" className="text-sm text-cream/80" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
            {lines.length === 0 && (
              <p className="text-sm text-mute">Try “what miles do I have?” or “do I need an account?”.</p>
            )}
            {lines.map((line) => (
              <p
                key={line.id}
                className={`max-w-[90%] px-3 py-2 text-sm leading-6 ${line.role === "user" ? "ml-auto bg-brown text-cream" : "bg-paper text-ink"}`}
              >
                {line.body}
              </p>
            ))}
            {pending && <p className="text-sm text-mute">Checking the trip data…</p>}
            {error && <p className="text-sm text-copper">{error}</p>}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
            <input
              className="field py-2"
              value={text}
              placeholder="Ask a question"
              onChange={(event) => setText(event.target.value)}
              aria-label="Question for Milla"
            />
            <button className="btn px-3" type="submit" disabled={pending}>
              Send
            </button>
          </form>
        </section>
      )}
      {!open && (
        <button type="button" className="btn" onClick={show}>
          Ask Milla
        </button>
      )}
    </div>
  );
}
