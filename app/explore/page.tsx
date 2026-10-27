import Link from "next/link";
import { ExploreForm } from "@/components/ExploreForm";
import { addDays, todayISO } from "@/lib/dates";
import { balancesMap } from "@/lib/db";
import { exploreFromWallet } from "@/lib/extras";
import { eur } from "@/lib/format";

export default function ExplorePage({ searchParams }: { searchParams: { from?: string } }) {
  const from = (searchParams.from ?? "MAD").toUpperCase();
  const date = addDays(todayISO(), 45);
  const hits = exploreFromWallet(from, "economy", balancesMap(), date);

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:px-6 md:py-14">
      <div>
        <p className="eyebrow">Where can my points take me?</p>
        <h1 className="mt-3 font-serif text-5xl">Trips your wallet can actually book.</h1>
        <p className="mt-3 max-w-2xl text-mute">
          Award Travel Finder starts from a route. Milla also starts from the miles you already hold, including 1:1 bank transfers, and only keeps seats worth at least 0.8 cents.
        </p>
      </div>
      <ExploreForm from={from} />
      {hits.length === 0 && (
        <p className="border border-dashed border-line px-4 py-8 text-mute">
          Add miles on the wallet page, or load the sample wallet, then come back.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {hits.map((hit) => (
          <Link
            key={hit.destination}
            href={`/fly?from=${hit.origin}&to=${hit.destination}&depart=${date}&return=${addDays(date, 8)}`}
            className="lift border border-line bg-paper p-5"
          >
            <p className="eyebrow">{hit.country}</p>
            <h2 className="mt-2 font-serif text-3xl">{hit.city}</h2>
            <p className="mt-3 text-lg">
              {hit.miles.toLocaleString("en-GB")} {hit.unit} + {eur(hit.taxes)} tax
            </p>
            <p className="mt-1 text-sm text-mute">
              {hit.programName} · {hit.cpp.toFixed(1)}¢ per point
              {hit.transferFrom ? ` · via ${hit.transferFrom}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
