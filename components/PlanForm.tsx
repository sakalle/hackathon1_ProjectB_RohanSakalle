"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AirportField } from "./AirportField";
import { CabinPills } from "./CabinPills";
import type { Cabin } from "@/lib/types";

interface LegDraft {
  origin: string;
  destination: string;
  date: string;
}

export function PlanForm({ start, next }: { start: string; next: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [legs, setLegs] = useState<LegDraft[]>([
    { origin: "MAD", destination: "LIS", date: start },
    { origin: "LIS", destination: "DSS", date: next },
    { origin: "DSS", destination: "BCN", date: addClient(next, 5) },
  ]);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [cabin, setCabin] = useState<Cabin>("economy");
  const [flexible, setFlexible] = useState(true);
  const [nearby, setNearby] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function update(index: number, patch: Partial<LegDraft>) {
    setLegs((current) => current.map((leg, i) => (i === index ? { ...leg, ...patch } : leg)));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (legs.some((leg) => !leg.origin || !leg.destination || !leg.date)) {
      setError("Every stop needs a from, a to, and a date.");
      return;
    }
    setPending(true);
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "plan",
        tripName: name,
        legs,
        adults,
        children,
        cabin,
        flexible,
        nearby,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setPending(false);
      setError(data.error ?? "The plan could not run.");
      return;
    }
    router.push(`/results/${data.id}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <label>
        <span className="eyebrow">Trip name</span>
        <input className="field mt-2" value={name} placeholder="Lisbon and Dakar" onChange={(event) => setName(event.target.value)} />
      </label>
      <div className="grid gap-4">
        {legs.map((leg, index) => (
          <div key={index} className="border border-line bg-paper p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">Flight {index + 1}</span>
              {legs.length > 2 && (
                <button type="button" className="text-sm text-copper" onClick={() => setLegs((current) => current.filter((_, i) => i !== index))}>
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <AirportField label="From" value={leg.origin} onChange={(origin) => update(index, { origin })} />
              <AirportField label="To" value={leg.destination} onChange={(destination) => update(index, { destination })} />
              <label>
                <span className="eyebrow">Date</span>
                <input className="field mt-2" type="date" value={leg.date} onChange={(event) => update(index, { date: event.target.value })} required />
              </label>
            </div>
          </div>
        ))}
      </div>
      {legs.length < 6 && (
        <button
          type="button"
          className="btn-ghost"
          onClick={() =>
            setLegs((current) => [
              ...current,
              {
                origin: current[current.length - 1]?.destination ?? "",
                destination: "",
                date: addClient(current[current.length - 1]?.date || start, 3),
              },
            ])
          }
        >
          Add a flight
        </button>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Adults" value={adults} min={1} max={9} onChange={setAdults} />
        <NumberField label="Children" value={children} min={0} max={8} onChange={setChildren} />
      </div>
      <CabinPills value={cabin} onChange={setCabin} />
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={flexible} onChange={(event) => setFlexible(event.target.checked)} />
          Flexible dates
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={nearby} onChange={(event) => setNearby(event.target.checked)} />
          Nearby airports
        </label>
      </div>
      {error && <p className="text-sm text-copper">{error}</p>}
      <button className="btn" disabled={pending} type="submit">
        {pending ? "Pricing every stop…" : "Show the saving"}
      </button>
    </form>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className="eyebrow">{label}</span>
      <input
        className="field mt-2"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function addClient(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
