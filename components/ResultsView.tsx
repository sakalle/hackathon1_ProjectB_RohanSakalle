"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cityLabel } from "@/lib/airports";
import { cabinLabel, cppLabel, eur, formatDuration, pct, pointsLabel, prettyDate, shortDate, weekday } from "@/lib/format";
import type { SearchRow } from "@/lib/db";
import type { Offer } from "@/lib/types";

export function ResultsView({
  search,
  savedOfferIds,
  bookings,
}: {
  search: SearchRow;
  savedOfferIds: string[];
  bookings: Record<string, string>;
}) {
  const live = search.offers.filter((offer) => !offer.locked);
  const locked = search.offers.filter((offer) => offer.locked);
  const best = live.find((offer) => offer.recommended) ?? live[0];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-6 md:py-12">
      <div>
        <p className="eyebrow">{search.mode === "plan" ? "Full trip plan" : "Quick flight"}</p>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl text-ink md:text-6xl">{search.title}</h1>
        <p className="mt-3 text-mute">
          {search.input.adults} adult{search.input.adults === 1 ? "" : "s"}
          {search.input.children ? ` · ${search.input.children} child${search.input.children === 1 ? "" : "ren"}` : ""} · {cabinLabel(search.input.cabin)}
          {search.input.flexible ? " · flexible dates" : ""}
          {search.input.nearby ? " · nearby airports" : ""}
        </p>
      </div>

      <section className="grid gap-px bg-line md:grid-cols-[1.3fr_0.8fr_0.8fr]">
        <div className="bg-brown px-6 py-8 text-cream">
          <p className="eyebrow text-[#e0b48a]">You save</p>
          <p className="mt-3 font-serif text-6xl md:text-7xl">{search.savingsEur > 0 ? eur(search.savingsEur) : eur(0)}</p>
          <p className="mt-3 max-w-sm text-cream/75">
            {search.savingsEur > 0
              ? `${pct(search.savingsPct)} under the normal fare. The saving is the product — it stays on screen.`
              : "Nothing on this trip beats the normal fare by enough to matter."}
          </p>
        </div>
        <PriceBlock label="Normal price" amount={search.normalPrice} detail="What most people pay for the obvious flight." muted />
        <PriceBlock label="Hacked price" amount={search.bestPrice} detail={best ? best.title : "No cheaper option held up."} />
      </section>

      {search.calendar.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl">The week around your dates</h2>
            <p className="text-sm text-mute">Same trip length. Cash fare only.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {search.calendar.map((day) => (
              <div key={day.date} className={`border px-3 py-3 ${day.lowest ? "border-ink bg-brown text-cream" : "border-line bg-paper"}`}>
                <p className={`text-xs uppercase tracking-wider ${day.lowest ? "text-[#e0b48a]" : "text-mute"}`}>{weekday(day.date)}</p>
                <p className="mt-1 text-sm">{shortDate(day.date)}</p>
                <p className="mt-2 font-serif text-2xl">{eur(day.price)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4">
        <h2 className="font-serif text-3xl">Ways to pay less</h2>
        {live.length === 0 && <p className="text-mute">Keep the normal fare. Changing the day, the airport, or the route does not pay for itself here.</p>}
        {live.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            searchId={search.id}
            saved={savedOfferIds.includes(offer.id)}
            bookingId={bookings[offer.id]}
          />
        ))}
      </section>

      {locked.length > 0 && (
        <section className="grid gap-4">
          <h2 className="font-serif text-3xl">If you had the points</h2>
          {locked.map((offer) => (
            <OfferCard key={offer.id} offer={offer} searchId={search.id} saved={false} bookingId={undefined} />
          ))}
        </section>
      )}

      <section className="grid gap-3 text-sm text-mute">
        {search.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </section>
    </div>
  );
}

function PriceBlock({ label, amount, detail, muted }: { label: string; amount: number; detail: string; muted?: boolean }) {
  return (
    <div className={`px-6 py-8 ${muted ? "bg-sand" : "bg-paper"}`}>
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-serif text-4xl">{eur(amount)}</p>
      <p className="mt-3 text-sm text-mute">{detail}</p>
    </div>
  );
}

function OfferCard({
  offer,
  searchId,
  saved,
  bookingId,
}: {
  offer: Offer;
  searchId: string;
  saved: boolean;
  bookingId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(offer.recommended);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [target, setTarget] = useState(Math.max(40, Math.round(offer.hackedPrice * 0.9)));
  const [email, setEmail] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  async function save() {
    setPending(true);
    setMessage("");
    const response = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchId, offerId: offer.id }),
    });
    const data = await response.json();
    setPending(false);
    setMessage(response.ok ? "Saved with your trips." : data.error);
    if (response.ok) router.refresh();
  }

  async function alert() {
    setPending(true);
    setMessage("");
    const response = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchId, offerId: offer.id, targetPrice: target, email }),
    });
    const data = await response.json();
    setPending(false);
    setMessage(response.ok ? "Alert is watching this trip." : data.error);
    if (response.ok) router.refresh();
  }

  return (
    <article className={`border bg-paper ${offer.recommended ? "border-ink" : "border-line"}`}>
      <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{offer.eyebrow}</span>
            {offer.recommended && <span className="bg-copper px-2 py-0.5 text-xs uppercase tracking-wider text-cream">Best</span>}
            {offer.tags.map((tag) => (
              <span key={tag} className="border border-line px-2 py-0.5 text-xs text-mute">
                {tag}
              </span>
            ))}
          </div>
          <h3 className="mt-2 font-serif text-3xl">{offer.title}</h3>
          <p className="mt-2 max-w-2xl text-mute">{offer.summary}</p>
        </div>
        <div className="md:text-right">
          <p className="font-serif text-4xl text-ink">{eur(offer.hackedPrice)}</p>
          <p className="mt-1 text-copper">
            {offer.locked ? "Not in your saving yet" : `Save ${eur(offer.savingsEur)} · ${pct(offer.savingsPct)}`}
          </p>
          {offer.points.length > 0 && (
            <p className="mt-2 text-sm text-mute">
              {offer.points.map((point) => pointsLabel(point.amount, point.unit)).join(" + ")}
              {offer.centsPerPoint != null ? ` · ${offer.centsPerPoint.toFixed(1)}¢ · ${cppLabel(offer.centsPerPoint)}` : ""}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4 md:px-6">
        <button type="button" className="btn-ghost" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide the reason" : "Why this works"}
        </button>
        {!offer.locked && offer.bookPath === "cash" && (
          <Link className="btn" href={bookingId ? `/bookings/${bookingId}` : `/book/${searchId}/${offer.id}`}>
            {bookingId ? "View booking" : "Book this fare"}
          </Link>
        )}
        {!offer.locked && offer.bookPath !== "cash" && (
          <Link className="btn" href={`/guide/${searchId}/${offer.id}`}>
            Booking steps
          </Link>
        )}
        {offer.locked && (
          <Link className="btn" href="/wallet">
            Add the miles
          </Link>
        )}
        {!offer.locked && (
          <button type="button" className="btn-ghost" disabled={pending || saved} onClick={save}>
            {saved ? "Saved" : "Save trip"}
          </button>
        )}
        {!offer.locked && (
          <button type="button" className="btn-ghost" onClick={() => setShowAlert((value) => !value)}>
            Price alert
          </button>
        )}
      </div>
      {showAlert && !offer.locked && (
        <div className="grid gap-3 border-t border-line px-5 py-4 sm:grid-cols-[1fr_1fr_auto] md:px-6">
          <label>
            <span className="eyebrow">Tell me under</span>
            <input className="field mt-2" type="number" min={1} value={target} onChange={(event) => setTarget(Number(event.target.value))} />
          </label>
          <label>
            <span className="eyebrow">Email, kept in the app</span>
            <input className="field mt-2" type="email" value={email} placeholder="you@email.com" onChange={(event) => setEmail(event.target.value)} />
          </label>
          <button type="button" className="btn self-end" disabled={pending} onClick={alert}>
            Watch this
          </button>
        </div>
      )}
      {open && (
        <div className="grid gap-5 border-t border-line px-5 py-5 md:grid-cols-[0.9fr_1.1fr] md:px-6">
          <div className="grid gap-3">
            {offer.why.map((reason) => (
              <p key={reason} className="text-sm leading-6">
                {reason}
              </p>
            ))}
            {offer.shortfall && (
              <p className="text-sm text-copper">
                You have {offer.shortfall.have.toLocaleString("en-GB")} {offer.shortfall.unit}. You need {offer.shortfall.need.toLocaleString("en-GB")} on {offer.shortfall.programName}.
              </p>
            )}
          </div>
          <div className="grid gap-2">
            {offer.slices.map((slice, index) => (
              <div key={`${slice.from}${slice.to}${slice.date}${index}`} className="border border-line bg-cream px-3 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">
                    {cityLabel(slice.from)} → {cityLabel(slice.to)}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-copper">{slice.award ? "Award" : "Cash"}</p>
                </div>
                <p className="mt-1 text-sm text-mute">
                  {prettyDate(slice.date)} · {slice.depart}–{slice.arrive}
                  {slice.nextDay ? " +1" : ""} · {formatDuration(slice.durationMin)} · {slice.carrier}
                </p>
                <p className="text-sm text-mute">
                  {cabinLabel(slice.cabin)}
                  {slice.stops ? ` · via ${slice.via.map(cityLabel).join(", ") || "connection"}` : " · nonstop"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {message && <p className="border-t border-line px-5 py-3 text-sm md:px-6">{message}</p>}
    </article>
  );
}
