"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemoveButton({ id, kind }: { id: string; kind: "saved" | "alert" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    await fetch(kind === "saved" ? "/api/saved" : "/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <button type="button" className="text-sm text-copper" disabled={pending} onClick={remove}>
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
