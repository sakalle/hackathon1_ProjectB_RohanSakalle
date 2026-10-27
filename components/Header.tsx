import Link from "next/link";
import { getSummary } from "@/lib/db";
import { eur } from "@/lib/format";

const links = [
  ["/fly", "Search"],
  ["/plan", "Full plan"],
  ["/explore", "Explorer"],
  ["/transfers", "Transfers"],
  ["/import", "Paste"],
  ["/wallet", "Miles"],
  ["/trips", "Trips"],
];

export function Header() {
  const summary = getSummary();
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 place-items-center bg-brown text-cream">
            <span className="font-serif text-lg leading-none">M</span>
          </span>
          <span>
            <span className="block font-serif text-xl leading-none text-ink">A Una Milla</span>
            <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-mute">Same trip. Less money.</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm md:gap-2">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap px-2 py-2 text-ink/80 hover:text-copper">
              {label}
            </Link>
          ))}
          <Link href="/trips" className="whitespace-nowrap bg-brown px-3 py-2 text-cream">
            {summary.bookedSavings > 0 ? `${eur(summary.bookedSavings)} saved` : "Your trips"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
