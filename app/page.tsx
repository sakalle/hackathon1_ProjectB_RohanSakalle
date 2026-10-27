import Link from "next/link";
import { QuickForm } from "@/components/QuickForm";
import { currentUser } from "@/lib/auth";
import { addDays, todayISO } from "@/lib/dates";
import { listLoyalty, listSearches } from "@/lib/db";
import { eur, prettyDate } from "@/lib/format";
import { programById } from "@/lib/programs";

export default function HomePage() {
  const today = todayISO();
  const defaults = {
    from: "MAD",
    to: "JFK",
    depart: addDays(today, 30),
    ret: addDays(today, 37),
  };
  const recent = listSearches(4);
  const user = currentUser();
  const miles = listLoyalty()
    .map((row) => {
      const program = programById(row.program_id);
      if (!program || row.balance <= 0) return null;
      return { name: program.name, balance: row.balance, unit: program.unit };
    })
    .filter((row): row is { name: string; balance: number; unit: string } => Boolean(row));

  return (
    <main>
      <section className="relative overflow-hidden bg-brown text-cream">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(700px 280px at 80% 10%, #b86a32, transparent)" }} />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1fr_1.05fr] md:px-6 md:py-16">
          <div className="flex flex-col justify-center">
            <p className="eyebrow text-[#e0b48a]">Compare every program · then book</p>
            <h1 className="mt-5 font-serif text-5xl leading-[0.95] md:text-7xl">Same trip. Much less money.</h1>
            <p className="mt-6 max-w-md text-lg text-cream/75">
              Normal fare against the hacked fare. Miles, nearby airports, smarter routes — then you book, or follow the steps.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/explore" className="btn bg-cream text-ink hover:bg-white">
                Where can my miles go?
              </Link>
              <Link href="/plan" className="btn-ghost border-cream/30 bg-transparent text-cream hover:border-cream">
                Full trip plan
              </Link>
            </div>
            <p className="mt-5 max-w-md text-sm text-cream/70">
              {user ? (
                <>Signed in as {user.name.split(" ")[0]}. You can log out any time. The miles stay on this computer.</>
              ) : (
                <>
                  An account is optional.{" "}
                  <Link href="/login" className="text-[#e0b48a] underline">
                    Sign in with Google
                  </Link>{" "}
                  if you want your name on the trip.
                </>
              )}
            </p>
          </div>
          <div className="bg-cream p-5 text-ink shadow-card md:p-7">
            <p className="eyebrow">Search 10 programs at once</p>
            <h2 className="mt-2 font-serif text-3xl">Check a trip</h2>
            <div className="mt-5">
              <QuickForm defaults={defaults} miles={miles} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3 md:px-6">
        {[
          ["21-style board", "Every loyalty program priced on the same route, with taxes and cents per point."],
          ["Award month", "Ten programs on one outbound calendar. Tap a day and the trip reprices."],
          ["Then you book", "Cash tickets inside the app. Awards with a step-by-step airline path."],
        ].map(([title, copy]) => (
          <div key={title} className="lift border border-line bg-paper p-6">
            <h3 className="font-serif text-2xl">{title}</h3>
            <p className="mt-3 text-mute">{copy}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 md:px-6">
        <h2 className="font-serif text-4xl">Two ways in</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link href="/fly" className="lift flex min-h-56 flex-col justify-between border border-line bg-paper p-6">
            <div>
              <p className="eyebrow">Option 1</p>
              <h3 className="mt-3 font-serif text-4xl">Quick flight</h3>
              <p className="mt-3 max-w-sm text-mute">One route, one answer. For someone who knows where they want to go.</p>
            </div>
            <p className="text-copper">Fast and simple</p>
          </Link>
          <Link href="/plan" className="lift flex min-h-56 flex-col justify-between bg-brown p-6 text-cream">
            <div>
              <p className="eyebrow text-[#e0b48a]">Option 2</p>
              <h3 className="mt-3 font-serif text-4xl">Full trip plan</h3>
              <p className="mt-3 max-w-sm text-cream/75">Several stops, dates and travellers. Where the biggest savings usually are.</p>
            </div>
            <p className="text-[#e0b48a]">Complete and detailed</p>
          </Link>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
          <h2 className="font-serif text-3xl">Recent searches</h2>
          <div className="mt-4 grid gap-3">
            {recent.map((search) => (
              <Link key={search.id} href={`/results/${search.id}`} className="lift flex items-center justify-between border border-line bg-paper px-4 py-4">
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
    </main>
  );
}
