"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cityLabel } from "@/lib/airports";
import { addDays, daysBetween } from "@/lib/dates";
import { cabinLabel, cppLabel, eur, formatDuration, pct, pointsLabel, prettyDate, shortDate, weekday } from "@/lib/format";
import type { AwardDay, BuiltSearch, Offer, ProgramQuote, SearchInput } from "@/lib/types";

type SearchView = {
  id: string;
  mode: string;
  title: string;
  input: SearchInput;
  normalPrice: number;
  bestPrice: number;
  savingsEur: number;
  savingsPct: number;
  offers: Offer[];
  calendar: BuiltSearch["calendar"];
  awardMonth: AwardDay[];
  programBoard: ProgramQuote[];
  notes: string[];
};

export function ResultsView({
  search,
  savedOfferIds,
  bookings,
}: {
  search: SearchView;
  savedOfferIds: string[];
  bookings: Record<string, string>;
}) {
  const liveFare = search.offers.some((offer) => offer.live);
  const live = search.offers.filter((offer) => !offer.locked);
  const locked = search.offers.filter((offer) => offer.locked);
  const best = live.find((offer) => offer.recommended) ?? live[0];
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "cash" | "miles" | "route">("all");
  const [shifting, setShifting] = useState("");
  const [shiftError, setShiftError] = useState("");

  async function searchDay(date: string) {
    const origin = search.input.legs[0]?.date;
    if (!origin || date === origin || shifting) return;
    const delta = daysBetween(origin, date);
    setShiftError("");
    setShifting(date);
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...search.input,
        legs: search.input.legs.map((leg) => ({ ...leg, date: addDays(leg.date, delta) })),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setShifting("");
      setShiftError(data.error ?? "That day could not be priced.");
      return;
    }
    router.push(`/results/${data.id}`);
  }
  const shown = live.filter((offer) => {
    if (filter === "cash") return offer.bookPath === "cash";
    if (filter === "miles") return offer.bookPath !== "cash";
    if (filter === "route") return offer.strategy === "smarter_route" || offer.strategy === "split_ticket" || offer.strategy === "nearby_airport" || offer.strategy === "flex_nearby";
    return true;
  });

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
        <PriceBlock
          label="Normal price"
          amount={search.normalPrice}
          detail={liveFare ? "Live Duffel fare for the dates you asked for." : "What most people pay for the obvious flight."}
          muted
        />
        <PriceBlock label="Hacked price" amount={search.bestPrice} detail={best ? best.title : "No cheaper option held up."} />
      </section>

      {search.awardMonth.length > 0 && (
        <AwardHeatmap days={search.awardMonth} busy={shifting} onPick={searchDay} />
      )}
      {shiftError && <p className="text-sm text-copper">{shiftError}</p>}
      {search.programBoard.length > 0 && <ProgramBoard rows={search.programBoard} />}

      {search.calendar.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl">The week around your dates</h2>
            <p className="text-sm text-mute">{liveFare ? "Same trip length. This week is still an estimate." : "Same trip length. Cash fare only."}</p>
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-3xl">Ways to pay less</h2>
          <div className="flex flex-wrap gap-2">
            {([
              ["all", "All"],
              ["cash", "Cash"],
              ["miles", "Miles"],
              ["route", "Routes"],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setFilter(id)} className={`chip ${filter === id ? "chip-on" : ""}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 && <p className="text-mute">Nothing in this filter. Try All.</p>}
        {shown.map((offer) => (
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
    <article className={`lift border bg-paper ${offer.recommended ? "border-ink shadow-card" : "border-line"}`}>
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
            {offer.locked ? "Not in your saving yet" : offer.live ? "Live fare to book" : `Save ${eur(offer.savingsEur)} · ${pct(offer.savingsPct)}`}
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
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="font-serif text-xl">{slice.from}</span>
                    <span className="h-px w-10 bg-copper" />
                    <span className="font-serif text-xl">{slice.to}</span>
                  </div>
                  <p className="text-xs uppercase tracking-wider text-copper">{slice.award ? "Award" : "Cash"}</p>
                </div>
                <p className="mt-2 text-sm text-mute">
                  {cityLabel(slice.from)} → {cityLabel(slice.to)} · {prettyDate(slice.date)} · {slice.depart}–{slice.arrive}
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

function AwardHeatmap({
  days,
  busy,
  onPick,
}: {
  days: AwardDay[];
  busy: string;
  onPick: (date: string) => void;
}) {
  const openDays = days.filter((day) => day.open && day.miles != null);
  const cheapest = openDays.reduce<AwardDay | null>((best, day) => {
    if (!best || (day.miles ?? Infinity) < (best.miles ?? Infinity)) return day;
    return best;
  }, null);
  const miles = openDays.map((day) => day.miles as number);
  const min = miles.length ? Math.min(...miles) : 0;
  const max = miles.length ? Math.max(...miles) : 1;
  const first = days[0]?.date;
  const pad = first ? new Date(`${first}T00:00:00Z`).getUTCDay() : 0;
  const label = first ? new Date(`${first}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) : "Month";
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-2xl">Award calendar · {label}</h2>
        <p className="text-sm text-mute">Outbound only. All 10 programs. Tap a day to reprice the trip.</p>
      </div>
      {cheapest?.miles != null && (
        <button type="button" onClick={() => onPick(cheapest.date)} className="mb-3 w-full bg-brown px-5 py-4 text-left text-cream">
          <p className="eyebrow text-[#e0b48a]">Cheapest award this month</p>
          <p className="mt-1 font-serif text-4xl">
            {Math.round(cheapest.miles / 1000)}k {cheapest.programName?.split(" ")[0]}
          </p>
          <p className="mt-1 text-sm text-cream/75">{prettyDate(cheapest.date)} · tap to price the whole trip on this day</p>
        </button>
      )}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-mute">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
        {Array.from({ length: pad }).map((_, index) => (
          <div key={`pad-${index}`} />
        ))}
        {days.map((day) => {
          const ratio = day.miles == null || max === min ? 0 : (day.miles - min) / (max - min);
          const bg = !day.open ? "#faf7f2" : `rgba(184, 106, 50, ${0.85 - ratio * 0.55})`;
          const color = !day.open || ratio < 0.45 ? "#1c1612" : "#f3efe6";
          return (
            <button
              key={day.date}
              type="button"
              disabled={Boolean(busy)}
              onClick={() => onPick(day.date)}
              className="min-h-[76px] border border-line/80 p-1.5 text-left disabled:opacity-60"
              style={{ background: bg, color }}
            >
              <p className="text-xs">{Number(day.date.slice(8, 10))}</p>
              <p className="mt-1 font-serif text-sm">{busy === day.date ? "…" : day.open && day.miles ? `${Math.round(day.miles / 1000)}k` : "—"}</p>
              <p className="truncate text-[10px] opacity-80">{day.programName?.split(" ")[0] ?? ""}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProgramBoard({ rows }: { rows: ProgramQuote[] }) {
  const best = rows.filter((row) => row.open && row.cpp != null).sort((a, b) => (b.cpp ?? 0) - (a.cpp ?? 0))[0];
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-2xl">Every program on this trip</h2>
        <p className="text-sm text-mute">Miles + tax per person. Open seats first.</p>
      </div>
      <div className="overflow-x-auto border border-line bg-paper">
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/50">
              <th className="px-3 py-3">Program</th>
              <th className="px-3 py-3">Miles</th>
              <th className="px-3 py-3">Tax</th>
              <th className="px-3 py-3">Value</th>
              <th className="px-3 py-3">Seat</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.programId} className={`border-b border-line/70 ${row.programId === best?.programId ? "bg-[#f4e4d2]" : ""}`}>
                <td className="px-3 py-3">
                  <span className="block font-medium">
                    {row.carrier}
                    {row.programId === best?.programId ? " · best value" : ""}
                  </span>
                  <span className="text-xs text-mute">{row.programName}</span>
                  {row.transferableFrom.length > 0 && (
                    <span className="mt-1 block text-xs text-mute">Transfer from {row.transferableFrom.join(", ")}</span>
                  )}
                </td>
                <td className="px-3 py-3">{row.miles ? `${row.miles.toLocaleString("en-GB")} ${row.unit}` : "—"}</td>
                <td className="px-3 py-3">{eur(row.taxes)}</td>
                <td className="px-3 py-3">{row.cpp != null ? `${row.cpp.toFixed(1)}¢` : "—"}</td>
                <td className="px-3 py-3">{row.open ? <span className="text-copper">Open</span> : <span className="text-mute">Waitlist</span>}</td>
                <td className="px-3 py-3 text-right">
                  <a className="text-copper" href={row.searchUrl} target="_blank" rel="noreferrer">
                    Airline
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
