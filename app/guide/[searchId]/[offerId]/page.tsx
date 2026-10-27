import Link from "next/link";
import { notFound } from "next/navigation";
import { BookForm } from "@/components/BookForm";
import { getSearch, listBookings } from "@/lib/db";
import { eur, pointsLabel } from "@/lib/format";

export default function GuidePage({ params }: { params: { searchId: string; offerId: string } }) {
  const search = getSearch(params.searchId);
  if (!search) notFound();
  const offer = search.offers.find((item) => item.id === params.offerId);
  if (!offer || offer.locked) notFound();
  const existing = listBookings().find((booking) => booking.searchId === search.id && booking.offerId === offer.id);
  const passengers = [
    ...Array.from({ length: search.input.adults }, () => ({ kind: "Adult" })),
    ...Array.from({ length: search.input.children }, () => ({ kind: "Child" })),
  ];

  return (
    <main className="mx-auto grid max-w-3xl gap-8 px-4 py-10 md:px-6">
      <div>
        <p className="eyebrow">Award steps</p>
        <h1 className="mt-3 font-serif text-5xl">{offer.title}</h1>
        <p className="mt-3 max-w-2xl text-mute">{offer.summary}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="bg-brown px-4 py-4 text-cream">
          <p className="eyebrow text-[#e0b48a]">Cash you pay</p>
          <p className="mt-2 font-serif text-3xl">{eur(offer.hackedPrice)}</p>
        </div>
        <div className="bg-sand px-4 py-4 sm:col-span-2">
          <p className="eyebrow">Points</p>
          <p className="mt-2 text-lg">
            {offer.points.length
              ? offer.points
                  .map((point) =>
                    point.source === "transfer"
                      ? `${pointsLabel(point.fromAmount ?? point.amount, "points")} from ${point.fromProgramName} → ${point.programName}`
                      : `${pointsLabel(point.amount, point.unit)} on ${point.programName}`,
                  )
                  .join(". ")
              : "No points on this option."}
          </p>
        </div>
      </div>
      <ol className="grid gap-4">
        {offer.guide.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[auto_1fr] gap-4 border border-line bg-paper p-4">
            <span className="font-serif text-2xl text-copper">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2 className="font-serif text-2xl">{step.title}</h2>
              <p className="mt-2 text-mute">{step.detail}</p>
              {step.href && (
                <a className="mt-3 inline-block text-sm text-copper" href={step.href} target="_blank" rel="noreferrer">
                  Open the airline site
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
      {existing ? (
        <Link className="btn" href={`/bookings/${existing.id}`}>
          View the recorded booking
        </Link>
      ) : (
        <div>
          <h2 className="font-serif text-3xl">I booked it</h2>
          <p className="mb-4 mt-2 text-mute">Record the passengers. The saving is added to your total. No card is taken on an award.</p>
          <BookForm searchId={search.id} offer={offer} passengers={passengers} />
        </div>
      )}
      <Link href={`/results/${search.id}`} className="text-sm text-copper">
        Back to the saving
      </Link>
    </main>
  );
}
