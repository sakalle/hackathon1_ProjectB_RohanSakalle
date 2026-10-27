import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";
import { currentUser } from "@/lib/auth";
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
  const user = currentUser();
  const saved = summary.bookedSavings > 0 ? `${eur(summary.bookedSavings)} saved` : "Your trips";
  const accountHref = user ? "/api/auth/logout" : "/login";
  const accountLabel = user ? `${user.name.split(" ")[0]} · Log out` : "Sign in";
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-cream/85 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center bg-brown text-cream">
            <span className="font-serif text-lg leading-none">M</span>
          </span>
          <span className="min-w-0">
            <span className="block truncate font-serif text-xl leading-none text-ink">A Una Milla</span>
            <span className="mt-1 hidden text-[11px] uppercase tracking-[0.14em] text-mute sm:block">Same trip. Less money.</span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <nav className="hidden items-center gap-1 text-sm lg:flex">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="whitespace-nowrap px-2 py-2 text-ink/80 hover:text-copper">
                {label}
              </Link>
            ))}
            <Link href={accountHref} className="whitespace-nowrap px-2 py-2 text-ink/80 hover:text-copper">
              {accountLabel}
            </Link>
            <Link href="/trips" className="whitespace-nowrap bg-brown px-3 py-2 text-cream">
              {saved}
            </Link>
          </nav>
          <Link href="/trips" className="whitespace-nowrap bg-brown px-3 py-2 text-sm text-cream lg:hidden">
            {saved}
          </Link>
          <MobileNav accountHref={accountHref} accountLabel={user ? "Log out" : "Sign in"} />
        </div>
      </div>
    </header>
  );
}
