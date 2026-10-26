"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Offer } from "@/lib/types";

export function BookForm({
  searchId,
  offer,
  passengers,
}: {
  searchId: string;
  offer: Offer;
  passengers: { kind: string }[];
}) {
  const router = useRouter();
  const [names, setNames] = useState(passengers.map(() => ""));
  const [email, setEmail] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const cash = offer.bookPath === "cash";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (cash) {
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        setError("Expiry should look like 08/28.");
        return;
      }
      const [month, year] = expiry.split("/").map(Number);
      const now = new Date();
      const exp = new Date(2000 + year, month - 1, 1);
      if (month < 1 || month > 12 || exp < new Date(now.getFullYear(), now.getMonth(), 1)) {
        setError("That card is expired.");
        return;
      }
      if (!/^\d{3,4}$/.test(cvc)) {
        setError("Add the security code. It is checked and not stored.");
        return;
      }
    }
    setPending(true);
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchId,
        offerId: offer.id,
        email,
        cardNumber: cash ? card : undefined,
        passengers: passengers.map((person, index) => ({ kind: person.kind, name: names[index] })),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setPending(false);
      setError(data.error ?? "Booking failed.");
      return;
    }
    router.push(`/bookings/${data.id}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {passengers.map((person, index) => (
        <label key={`${person.kind}-${index}`}>
          <span className="eyebrow">
            {person.kind} {index + 1} · passport name
          </span>
          <input className="field mt-2" value={names[index]} onChange={(event) => setNames((current) => current.map((name, i) => (i === index ? event.target.value : name)))} required />
        </label>
      ))}
      <label>
        <span className="eyebrow">Email</span>
        <input className="field mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      {cash && (
        <div className="grid gap-4 border border-line bg-cream p-4">
          <p className="text-sm text-mute">
            The card is checked, then only the last four digits are stored. Try 4242 4242 4242 4242, any future expiry, any CVC. Nothing is charged.
          </p>
          <label>
            <span className="eyebrow">Card number</span>
            <input className="field mt-2" inputMode="numeric" autoComplete="off" value={card} onChange={(event) => setCard(event.target.value)} required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="eyebrow">Expiry</span>
              <input className="field mt-2" placeholder="08/28" value={expiry} onChange={(event) => setExpiry(event.target.value)} required />
            </label>
            <label>
              <span className="eyebrow">CVC</span>
              <input className="field mt-2" inputMode="numeric" value={cvc} onChange={(event) => setCvc(event.target.value)} required />
            </label>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-copper">{error}</p>}
      <button className="btn" disabled={pending} type="submit">
        {pending ? "Confirming…" : cash ? "Confirm booking" : "Record this booking"}
      </button>
    </form>
  );
}
