import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-brown text-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.3fr_1fr] md:px-6">
        <div>
          <p className="font-serif text-3xl">The savings are the product.</p>
          <p className="mt-3 max-w-md text-cream/70">Compare every loyalty program, then book the cash fare or follow the award steps.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream/80">
          <Link href="/fly">Search</Link>
          <Link href="/explore">Where miles go</Link>
          <Link href="/transfers">Transfer map</Link>
          <Link href="/wallet">Wallet</Link>
          <Link href="/trips">Trips</Link>
        </div>
      </div>
    </footer>
  );
}
