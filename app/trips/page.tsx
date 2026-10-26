import Link from "next/link";
import { RemoveButton } from "@/components/TripActions";
import { getProfile, getSummary, listAlerts, listBookings, listSaved, listSearches } from "@/lib/db";
import { eur, prettyDate } from "@/lib/format";

export default function TripsPage() {
  const profile = getProfile();
  const summary = getSummary();
  const saved = listSaved();
  const alerts = listAlerts();
  const bookings = listBookings();
  const recent = listSearches(8);

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:px-6 md:py-14">
      <div>
        <p className="eyebrow">{profile.name}</p>
        <h1 className="mt-3 font-serif text-5xl">Trips and savings</h1>
      </div>
      <section className="grid gap-px bg-line md:grid-cols-3">
        <Stat label="Booked savings" value={eur(summary.bookedSavings)} detail={`${summary.bookings} booking${summary.bookings === 1 ? "" : "s"} confirmed`} dark />
        <Stat label="Watched savings" value={eur(summary.watchedSavings)} detail={`${summary.savedTrips} saved trip${summary.savedTrips === 1 ? "" : "s"}`} />
        <Stat label="Alerts" value={String(summary.alerts)} detail={`${summary.triggered} already under target`} />
      </section>

      <section>
        <h2 className="font-serif text-3xl">Bookings</h2>
        <div className="mt-4 grid gap-3">
          {bookings.length === 0 && <Empty text="Nothing booked yet. A confirmed fare lands here with its reference." />}
          {bookings.map((booking) => (
            <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex items-center justify-between border border-line bg-paper px-4 py-4">
              <span>
                <span className="block font-medium">{booking.title}</span>
                <span className="text-sm text-mute">{booking.confirmation}</span>
              </span>
              <span className="text-right">
                <span className="block font-serif text-2xl">{eur(booking.savingsEur)}</span>
                <span className="text-xs text-mute">paid {eur(booking.totalPaid)}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-3xl">Saved trips</h2>
        <div className="mt-4 grid gap-3">
          {saved.length === 0 && <Empty text="Save an option from a result and the potential saving is counted here." />}
          {saved.map((trip) => (
            <div key={trip.id} className="flex items-center justify-between gap-4 border border-line bg-paper px-4 py-4">
              <Link href={`/results/${trip.searchId}`}>
                <span className="block font-medium">{trip.title}</span>
                <span className="text-sm text-mute">
                  {eur(trip.hackedPrice)} instead of {eur(trip.normalPrice)}
                </span>
              </Link>
              <div className="text-right">
                <p className="font-serif text-2xl">{eur(trip.savingsEur)}</p>
                <RemoveButton id={trip.id} kind="saved" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-3xl">Price alerts</h2>
        <p className="mt-2 max-w-2xl text-sm text-mute">
          An alert lights up when the watched fare, or any day in its week, is at or under your target. Emails are stored with the watch. This demo does not send mail.
        </p>
        <div className="mt-4 grid gap-3">
          {alerts.length === 0 && <Empty text="Set a target on a result. If the fare is already under it, the alert is live now." />}
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between gap-4 border border-line bg-paper px-4 py-4">
              <Link href={`/results/${alert.searchId}`}>
                <span className="block font-medium">{alert.title}</span>
                <span className="text-sm text-mute">
                  Target {eur(alert.targetPrice)}
                  {alert.lastPrice != null ? ` · now ${eur(alert.lastPrice)}` : ""}
                  {alert.email ? ` · ${alert.email}` : ""}
                </span>
              </Link>
              <div className="text-right">
                <p className={alert.triggered ? "text-copper" : "text-mute"}>{alert.triggered ? "Under target" : "Watching"}</p>
                <RemoveButton id={alert.id} kind="alert" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-3xl">Recent searches</h2>
        <div className="mt-4 grid gap-3">
          {recent.length === 0 && <Empty text="Your first search will show up here." />}
          {recent.map((search) => (
            <Link key={search.id} href={`/results/${search.id}`} className="flex items-center justify-between border border-line bg-paper px-4 py-4">
              <span>
                <span className="block font-medium">{search.title}</span>
                <span className="text-sm text-mute">{prettyDate(search.createdAt.slice(0, 10))}</span>
              </span>
              <span className="font-serif text-2xl">{eur(search.savingsEur)}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, detail, dark }: { label: string; value: string; detail: string; dark?: boolean }) {
  return (
    <div className={`px-5 py-6 ${dark ? "bg-brown text-cream" : "bg-paper"}`}>
      <p className={`eyebrow ${dark ? "text-[#e0b48a]" : ""}`}>{label}</p>
      <p className="mt-3 font-serif text-4xl">{value}</p>
      <p className={`mt-2 text-sm ${dark ? "text-cream/70" : "text-mute"}`}>{detail}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="border border-dashed border-line px-4 py-6 text-mute">{text}</p>;
}
