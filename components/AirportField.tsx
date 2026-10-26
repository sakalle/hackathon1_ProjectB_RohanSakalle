"use client";

import { useEffect, useRef, useState } from "react";
import { placeLabel, searchAirports } from "@/lib/airports";

export function AirportField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value ? placeLabel(value) : "");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value ? placeLabel(value) : "");
  }, [value]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matches = searchAirports(query);

  return (
    <label className="block" ref={box}>
      <span className="eyebrow">{label}</span>
      <div className="relative mt-2">
        <input
          className="field"
          value={query}
          placeholder={placeholder ?? "City or code"}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (value) onChange("");
          }}
        />
        {open && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto border border-line bg-paper shadow-card">
            {matches.length === 0 && <li className="px-3 py-3 text-sm text-mute">No airport matches.</li>}
            {matches.map((airport) => (
              <li key={airport.iata}>
                <button
                  type="button"
                  className="flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left hover:bg-sand/60"
                  onClick={() => {
                    onChange(airport.iata);
                    setQuery(placeLabel(airport.iata));
                    setOpen(false);
                  }}
                >
                  <span>
                    <span className="font-medium">{airport.city}</span>
                    <span className="mt-0.5 block text-xs text-mute">
                      {airport.name} · {airport.country}
                    </span>
                  </span>
                  <span className="text-sm text-copper">{airport.iata}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
}
