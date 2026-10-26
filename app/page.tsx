import Link from "next/link";
import { addDays, todayISO } from "@/lib/dates";
import { listSearches } from "@/lib/db";
import { eur, prettyDate } from "@/lib/format";

export default function HomePage() {
  const today = todayISO();
  const depart = addDays(today, 30);
  const back = addDays(today, 37);
  const recent = listSearches(4);
  const examples = [
    ["Madrid to New York", "MAD", "JFK"],
    ["Valencia to Buenos Aires", "VLC", "EZE"],
    ["Barcelona to Tokyo", "BCN", "HND"],
    ["Málaga to London", "AGP", "LGW"],
  ];

  return (
    <main>
      <section className="bg-brown text-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 md:py-24">
          <div>
            <p className="eyebrow text-[#e0b48a]">A Una Milla de Tu Destino</p>
            <h1 className="mt-6 font-serif text-6xl leading-[0.95] md:text-7xl">A Una Milla</h1>
            <div className="rule mt-6 bg-[#e0b48a]" />
            <p className="mt-6 text-lg text-cream/80">A Una Milla de Tu Destino</p>
            <p className="text-cream/60">@aunamilladetudestino · Instagram</p>
          </div>
          <div className="flex flex-col justify-end">
            <p className="eyebrow text-[#e0b48a]">The idea</p>
            <h2 className="mt-4 font-serif text-5xl leading-[1.05] md:text-6xl">Same trip. Much less money.</h2>
            <p className="mt-6 max-w-md text-lg text-cream/75">Travel hacking, made simple for anyone.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/fly" className="btn bg-cream text-ink hover:bg-white">
                Check a flight
              </Link>
              <Link href="/plan" className="btn-ghost border-cream/30 text-cream hover:border-cream">
                Plan a whole trip
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[1.1fr_0.9fr] md:px-6">
        <div>
          <p className="eyebrow">The problem</p>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl">Most people pay full price because travel hacking feels complicated.</h2>
          <p className="mt-5 max-w-xl text-lg text-mute">
            Miles, points, flexible dates, nearby airports, smarter routes. The savings are real, but finding them takes knowledge and hours of searching.
          </p>
        </div>
        <div className="bg-sand">
          <div className="px-6 py-8">
            <p className="eyebrow">The question every user has</p>
            <p className="mt-4 font-serif text-4xl">How much could I save on this trip?</p>
          </div>
          <div className="bg-brown px-6 py-8 text-cream">
            <p className="eyebrow text-[#e0b48a]">What we build</p>
            <p className="mt-3 text-2xl">An app that answers it in seconds, then lets you book.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6 md:px-6">
        <h2 className="font-serif text-4xl">Two ways in</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link href="/fly" className="flex min-h-64 flex-col justify-between border border-line bg-paper p-6">
            <div>
              <p className="eyebrow">Option 1</p>
              <h3 className="mt-3 font-serif text-4xl">Quick flight</h3>
              <p className="mt-3 max-w-sm text-mute">One route, one answer. For someone who knows where they want to go.</p>
            </div>
            <p className="text-copper">Fast and simple</p>
          </Link>
          <Link href="/plan" className="flex min-h-64 flex-col justify-between bg-brown p-6 text-cream">
            <div>
              <p className="eyebrow text-[#e0b48a]">Option 2</p>
              <h3 className="mt-3 font-serif text-4xl">Full trip plan</h3>
              <p className="mt-3 max-w-sm text-cream/75">Several stops, dates and travellers. Where the biggest savings usually are.</p>
            </div>
            <p className="text-[#e0b48a]">Complete and detailed</p>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-4xl">Try a route</h2>
          <Link href="/import" className="text-sm text-copper">
            Or paste a link
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {examples.map(([label, from, to]) => (
            <Link
              key={label}
              href={`/fly?from=${from}&to=${to}&depart=${depart}&return=${back}`}
              className="flex items-center justify-between border border-line bg-paper px-4 py-4 hover:border-ink"
            >
              <span>{label}</span>
              <span className="text-sm text-mute">
                {from} → {to}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
          <h2 className="font-serif text-3xl">Recent searches</h2>
          <div className="mt-4 grid gap-3">
            {recent.map((search) => (
              <Link key={search.id} href={`/results/${search.id}`} className="flex items-center justify-between border border-line bg-paper px-4 py-4">
                <span>
                  <span className="block font-medium">{search.title}</span>
                  <span className="text-sm text-mute">{prettyDate(search.createdAt.slice(0, 10))}</span>
                </span>
                <span className="text-right">
                  <span className="block font-serif text-2xl">{eur(search.savingsEur)}</span>
                  <span className="text-xs uppercase tracking-wider text-mute">saved</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1.4fr_0.8fr] md:px-6">
          <p className="font-serif text-3xl text-copper">The savings are the product. Make them impossible to miss.</p>
          <p className="text-mute">Start by learning how travel hacking works — then book the flight, or take the steps.</p>
        </div>
      </section>
    </main>
  );
}
