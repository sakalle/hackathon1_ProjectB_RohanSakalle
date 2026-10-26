import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultsView } from "@/components/ResultsView";
import { getSearch, listBookings, listSaved } from "@/lib/db";

export default function ResultsPage({ params }: { params: { id: string } }) {
  const search = getSearch(params.id);
  if (!search) notFound();
  const savedOfferIds = listSaved()
    .filter((trip) => trip.searchId === search.id)
    .map((trip) => trip.offerId);
  const bookings: Record<string, string> = {};
  for (const booking of listBookings()) {
    if (booking.searchId === search.id) bookings[booking.offerId] = booking.id;
  }
  return (
    <main>
      <div className="mx-auto flex max-w-6xl justify-end px-4 pt-6 md:px-6">
        <Link href={search.mode === "plan" ? "/plan" : "/fly"} className="text-sm text-copper">
          New search
        </Link>
      </div>
      <ResultsView search={search} savedOfferIds={savedOfferIds} bookings={bookings} />
    </main>
  );
}
