import Link from "next/link";
import { getSummary } from "@/lib/db";
import { eur } from "@/lib/format";

const links = [
  ["/fly", "Quick flight"],
  ["/plan", "Full plan"],
  ["/import", "Paste a trip"],
  ["/wallet", "Miles"],
  ["/trips", "Trips"],
];

export function Header() {
  const summary = getSummary();
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="min-w-0">
          <span className="block font-serif text-xl leading-none text-ink">A Una Milla</span>
          <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-mute">Same trip. Less money.</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm md:gap-2">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap px-2 py-2 text-ink/80 hover:text-ink">
              {label}
            </Link>
          ))}
          {summary.bookedSavings > 0 && (
            <Link href="/trips" className="whitespace-nowrap bg-brown px-3 py-2 text-cream">
              {eur(summary.bookedSavings)} saved
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
