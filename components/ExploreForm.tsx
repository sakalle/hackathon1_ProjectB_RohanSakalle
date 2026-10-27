"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AirportField } from "./AirportField";

export function ExploreForm({ from }: { from: string }) {
  const router = useRouter();
  const [origin, setOrigin] = useState(from);

  return (
    <form
      className="grid gap-4 border border-line bg-paper p-4 sm:grid-cols-[1fr_auto] sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        if (!origin) return;
        router.push(`/explore?from=${origin}`);
      }}
    >
      <AirportField label="Home airport" value={origin} onChange={setOrigin} placeholder="Madrid, Valencia…" />
      <button className="btn" type="submit">
        Find destinations
      </button>
    </form>
  );
}
