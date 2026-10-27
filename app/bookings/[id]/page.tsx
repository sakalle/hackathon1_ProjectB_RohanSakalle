import Link from "next/link";
import { notFound } from "next/navigation";
import { getBooking, getSearch } from "@/lib/db";
import { eur, prettyDate } from "@/lib/format";

export default function BookingPage({ params }: { params: { id: string } }) {
  const booking = getBooking(params.id);
  if (!booking) notFound();
  const search = getSearch(booking.searchId);
  const offer = search?.offers.find((item) => item.id === booking.offerId);

  return (
    <main className="mx-auto grid max-w-3xl gap-8 px-4 py-12 md:px-6">
      <div className="bg-brown px-6 py-10 text-cream">
        <p className="eyebrow text-[#e0b48a]">Confirmed</p>
        <h1 className="mt-4 font-serif text-5xl md:text-6xl">{booking.confirmation}</h1>
        <p className="mt-4 text-cream/75">{booking.title}</p>
      </div>
      <div className="grid gap-px bg-line sm:grid-cols-3">
        <div className="bg-paper px-4 py-4">
          <p className="eyebrow">Paid</p>
          <p className="mt-2 font-serif text-3xl">{eur(booking.totalPaid)}</p>
        </div>
        <div className="bg-paper px-4 py-4">
          <p className="eyebrow">Saved</p>
          <p className="mt-2 font-serif text-3xl text-copper">{eur(booking.savingsEur)}</p>
        </div>
        <div className="bg-paper px-4 py-4">
          <p className="eyebrow">When</p>
          <p className="mt-2 text-lg">{prettyDate(booking.createdAt.slice(0, 10))}</p>
        </div>
      </div>
      <section>
        <h2 className="font-serif text-3xl">Travellers</h2>
        <ul className="mt-3 grid gap-2">
          {booking.passengers.map((person) => (
            <li key={person.name} className="border border-line bg-paper px-4 py-3">
              {person.name} <span className="text-mute">· {person.kind}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-mute">
          Confirmation sent to the address on file: {booking.email}
          {booking.last4 ? `. Card ending ${booking.last4}. The full number was not stored.` : ". No card was stored."}
          {offer?.live ? " Duffel placed this order and took payment from the Duffel balance. The card was not sent to Duffel." : ""}
        </p>
      </section>
      {offer && (
        <section>
          <h2 className="font-serif text-3xl">What was booked</h2>
          <p className="mt-2 text-mute">{offer.summary}</p>
        </section>
      )}
      <div className="flex flex-wrap gap-4">
        <Link href="/trips" className="btn">
          All trips
        </Link>
        {search && (
          <Link href={`/results/${search.id}`} className="btn-ghost">
            The original search
          </Link>
        )}
      </div>
    </main>
  );
}
