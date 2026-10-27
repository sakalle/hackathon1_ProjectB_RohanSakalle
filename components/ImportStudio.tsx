"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AirportField } from "./AirportField";
import { CabinPills } from "./CabinPills";
import { placeLabel } from "@/lib/airports";
import type { ParsedTrip } from "@/lib/types";

const examples = [
  "Madrid to New York 18 Dec 2026 return 2 Jan 2027, 2 adults",
  "https://www.skyscanner.net/transport/flights/vlc/eze/261214/261228/",
  "Barcelona to Lisbon 12 Nov 2026, Lisbon to Dakar 16 Nov 2026, Dakar to Barcelona 22 Nov 2026, 1 adult",
];

export function ImportStudio() {
  const router = useRouter();
  const [text, setText] = useState(examples[0]);
  const [parsed, setParsed] = useState<ParsedTrip | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [reading, setReading] = useState(false);

  async function readText(source: string) {
    setError("");
    setReading(true);
    const response = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: source }),
    });
    const data = await response.json();
    setReading(false);
    if (!response.ok) {
      setError(data.error);
      return;
    }
    setParsed(data as ParsedTrip);
  }

  async function onFile(file: File) {
    setError("");
    setReading(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const result = await worker.recognize(file);
      await worker.terminate();
      const found = result.data.text?.trim() ?? "";
      setText(found || text);
      if (!found) {
        setReading(false);
        setError("No words were read from that image. Paste the itinerary as text.");
        return;
      }
      await readText(found);
    } catch {
      setReading(false);
      setError("The screenshot could not be read. Paste the link or the cities instead.");
    }
  }

  async function search() {
    if (!parsed || parsed.legs.length === 0) {
      setError("Read a trip before searching.");
      return;
    }
    setPending(true);
    setError("");
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: parsed.mode,
        legs: parsed.legs,
        adults: parsed.adults,
        children: parsed.children,
        cabin: parsed.cabin,
        flexible: true,
        nearby: true,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setPending(false);
      setError(data.error);
      return;
    }
    router.push(`/results/${data.id}`);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <button key={example} type="button" className="btn-ghost text-left text-sm" onClick={() => setText(example)}>
            {example.length > 48 ? `${example.slice(0, 48)}…` : example}
          </button>
        ))}
      </div>
      <label>
        <span className="eyebrow">Link or sentence</span>
        <textarea className="field mt-2 min-h-32" value={text} onChange={(event) => setText(event.target.value)} />
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn" disabled={reading} onClick={() => readText(text)}>
          {reading ? "Reading…" : "Read the trip"}
        </button>
        <label className="btn-ghost cursor-pointer">
          Upload a screenshot
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </label>
      </div>
      {parsed && (
        <div className="grid gap-4 border border-line bg-paper p-4">
          <p className="eyebrow">{parsed.mode === "plan" ? "Full plan" : "Quick flight"}</p>
          {parsed.notes.map((note) => (
            <p key={note} className="text-sm text-mute">
              {note}
            </p>
          ))}
          <div className="grid gap-3">
            {parsed.legs.map((leg, index) => (
              <div key={index} className="grid gap-3 md:grid-cols-3">
                <AirportField
                  label="From"
                  value={leg.origin}
                  onChange={(origin) =>
                    setParsed({ ...parsed, legs: parsed.legs.map((item, i) => (i === index ? { ...item, origin } : item)) })
                  }
                />
                <AirportField
                  label="To"
                  value={leg.destination}
                  onChange={(destination) =>
                    setParsed({ ...parsed, legs: parsed.legs.map((item, i) => (i === index ? { ...item, destination } : item)) })
                  }
                />
                <label>
                  <span className="eyebrow">Date</span>
                  <input
                    className="field mt-2"
                    type="date"
                    value={leg.date}
                    onChange={(event) =>
                      setParsed({
                        ...parsed,
                        legs: parsed.legs.map((item, i) => (i === index ? { ...item, date: event.target.value } : item)),
                      })
                    }
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="eyebrow">Adults</span>
              <input className="field mt-2" type="number" min={1} max={9} value={parsed.adults} onChange={(event) => setParsed({ ...parsed, adults: Number(event.target.value) })} />
            </label>
            <label>
              <span className="eyebrow">Children</span>
              <input className="field mt-2" type="number" min={0} max={8} value={parsed.children} onChange={(event) => setParsed({ ...parsed, children: Number(event.target.value) })} />
            </label>
          </div>
          <CabinPills value={parsed.cabin} onChange={(cabin) => setParsed({ ...parsed, cabin })} />
          <p className="text-sm text-mute">
            {parsed.legs.map((leg) => `${placeLabel(leg.origin)} → ${placeLabel(leg.destination)}`).join(" · ")}
          </p>
          <button type="button" className="btn" disabled={pending} onClick={search}>
            {pending ? "Pricing it…" : "Show the saving"}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-copper">{error}</p>}
    </div>
  );
}
