"use client";

import type { Cabin } from "@/lib/types";

const OPTIONS: { id: Cabin; label: string; title: string }[] = [
  { id: "economy", label: "Economy", title: "Economy" },
  { id: "premium", label: "Premium", title: "Premium economy" },
  { id: "business", label: "Business", title: "Business" },
];

export function CabinPills({ value, onChange }: { value: Cabin; onChange: (cabin: Cabin) => void }) {
  return (
    <div>
      <span className="eyebrow">Cabin</span>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            title={option.title}
            onClick={() => onChange(option.id)}
            className={`chip shrink-0 ${value === option.id ? "chip-on" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
