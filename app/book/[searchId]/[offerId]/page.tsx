import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookForm } from "@/components/BookForm";
import { getSearch, listBookings } from "@/lib/db";
import { eur } from "@/lib/format";

export default function BookPage({ params }: { params: { searchId: string; offerId: string } }) {
  const search = getSearch(params.searchId);
  if (!search) notFound();
  const offer = search.offers.find((item) => item.id === params.offerId);
  if (!offer || offer.locked) notFound();
  if (offer.bookPath !== "cash") redirect(`/guide/${search.id}/${offer.id}`);
  const existing = listBookings().find((booking) => booking.searchId === search.id && booking.offerId === offer.id);
  if (existing) redirect(`/bookings/${existing.id}`);
  const passengers = [
    ...Array.from({ length: search.input.adults }, () => ({ kind: "Adult" })),
    ...Array.from({ length: search.input.children }, () => ({ kind: "Child" })),
  ];

  return (
    <main className="mx-auto grid max-w-xl gap-6 px-4 py-10 md:px-6">
      <div>
        <p className="eyebrow">Book inside the app</p>
        <h1 className="mt-3 font-serif text-5xl">{search.title}</h1>
        <p className="mt-3 text-mute">{offer.title}</p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-line">
        <div className="bg-sand px-4 py-4">
          <p className="eyebrow">Normal</p>
          <p className="mt-2 font-serif text-3xl">{eur(offer.normalPrice)}</p>
        </div>
        <div className="bg-brown px-4 py-4 text-cream">
          <p className="eyebrow text-[#e0b48a]">You pay</p>
          <p className="mt-2 font-serif text-3xl">{eur(offer.hackedPrice)}</p>
        </div>
      </div>
      <BookForm searchId={search.id} offer={offer} passengers={passengers} />
      <Link href={`/results/${search.id}`} className="text-sm text-copper">
        Back to the saving
      </Link>
    </main>
  );
}
