"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AirportField } from "./AirportField";
import type { Cabin } from "@/lib/types";

export function QuickForm({
  defaults,
  miles,
}: {
  defaults: { from: string; to: string; depart: string; ret: string };
  miles: { name: string; balance: number; unit: string }[];
}) {
  const router = useRouter();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [depart, setDepart] = useState(defaults.depart);
  const [ret, setRet] = useState(defaults.ret);
  const [oneWay, setOneWay] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [cabin, setCabin] = useState<Cabin>("economy");
  const [flexible, setFlexible] = useState(true);
  const [nearby, setNearby] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!from || !to) {
      setError("Choose both airports.");
      return;
    }
    setPending(true);
    const legs = [{ origin: from, destination: to, date: depart }];
    if (!oneWay && ret) legs.push({ origin: to, destination: from, date: ret });
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "quick",
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
      setError(data.error ?? "The search could not run.");
      return;
    }
    router.push(`/results/${data.id}`);
  }

  const chips = [
    ["MAD", "JFK", "Madrid → New York"],
    ["LHR", "JFK", "London → New York"],
    ["BCN", "HND", "Barcelona → Tokyo"],
    ["VLC", "EZE", "Valencia → Buenos Aires"],
    ["AGP", "LGW", "Málaga → London"],
  ];

  return (
    <form onSubmit={submit} className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        {chips.map(([chipFrom, chipTo, label]) => (
          <button
            key={label}
            type="button"
            className="chip"
            onClick={() => {
              setFrom(chipFrom);
              setTo(chipTo);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <AirportField label="From" value={from} onChange={setFrom} placeholder="Madrid, Málaga, Valencia…" />
        <button
          type="button"
          className="btn-ghost h-[52px] px-3 md:mb-0"
          onClick={() => {
            const nextFrom = to;
            setTo(from);
            setFrom(nextFrom);
          }}
          aria-label="Swap airports"
        >
          Swap
        </button>
        <AirportField label="To" value={to} onChange={setTo} placeholder="New York, Lisbon, Tokyo…" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="eyebrow">Depart</span>
          <input className="field mt-2" type="date" value={depart} onChange={(event) => setDepart(event.target.value)} required />
        </label>
        <label>
          <span className="eyebrow">Return</span>
          <input
            className="field mt-2"
            type="date"
            value={ret}
            disabled={oneWay}
            onChange={(event) => setRet(event.target.value)}
            required={!oneWay}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={oneWay} onChange={(event) => setOneWay(event.target.checked)} />
        One way
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Stepper label="Adults" value={adults} min={1} max={9} onChange={setAdults} />
        <Stepper label="Children" value={children} min={0} max={8} onChange={setChildren} />
      </div>
      <div>
        <span className="eyebrow">Cabin</span>
        <div className="mt-2 grid grid-cols-3 border border-line">
          {(["economy", "premium", "business"] as Cabin[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCabin(option)}
              className={`px-2 py-3 text-sm ${cabin === option ? "bg-brown text-cream" : "bg-white/50"}`}
            >
              {option === "premium" ? "Premium" : option === "business" ? "Business" : "Economy"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle on={flexible} setOn={setFlexible} title="Flexible dates" detail="Check three days either side." />
        <Toggle on={nearby} setOn={setNearby} title="Nearby airports" detail="Include the taxi in the saving." />
      </div>
      <div className="border border-line bg-paper px-4 py-3 text-sm text-mute">
        {miles.length === 0
          ? "No miles saved yet. Cash hacks still run. Add a balance if you want award prices."
          : `Using ${miles.map((mile) => `${mile.balance.toLocaleString("en-GB")} ${mile.unit} on ${mile.name}`).join(" · ")}.`}
      </div>
      {error && <p className="text-sm text-copper">{error}</p>}
      <button className="btn" disabled={pending} type="submit">
        {pending ? "Checking the trip…" : "Show the saving"}
      </button>
    </form>
  );
}

function Stepper({
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
    <div>
      <span className="eyebrow">{label}</span>
      <div className="mt-2 flex items-center border border-line bg-white/50">
        <button type="button" className="px-4 py-3" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer ${label}`}>
          −
        </button>
        <span className="flex-1 text-center">{value}</span>
        <button type="button" className="px-4 py-3" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`More ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}

function Toggle({ on, setOn, title, detail }: { on: boolean; setOn: (value: boolean) => void; title: string; detail: string }) {
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={`border px-4 py-3 text-left ${on ? "border-ink bg-brown text-cream" : "border-line bg-paper text-ink"}`}
    >
      <span className="block text-sm font-medium">{title}</span>
      <span className={`mt-1 block text-xs ${on ? "text-cream/70" : "text-mute"}`}>{detail}</span>
    </button>
  );
}
