"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  ["/fly", "Search"],
  ["/plan", "Full plan"],
  ["/explore", "Explorer"],
  ["/transfers", "Transfers"],
  ["/import", "Paste"],
  ["/wallet", "Miles"],
  ["/trips", "Trips"],
];

export function MobileNav({ accountHref, accountLabel }: { accountHref: string; accountLabel: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="btn-ghost px-3 py-2 text-sm"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close" : "Menu"}
      </button>
      {open && (
        <nav id="mobile-nav" className="absolute inset-x-0 top-full z-40 border-b border-line bg-cream px-4 py-3 shadow-card">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="block px-2 py-3 text-lg text-ink" onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link href={accountHref} className="block px-2 py-3 text-lg text-copper" onClick={() => setOpen(false)}>
            {accountLabel}
          </Link>
        </nav>
      )}
    </div>
  );
}
