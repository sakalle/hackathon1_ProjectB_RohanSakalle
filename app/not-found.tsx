import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24">
      <p className="eyebrow">Missing</p>
      <h1 className="mt-3 font-serif text-5xl">That page is not on this trip.</h1>
      <Link href="/" className="btn mt-8">
        Go home
      </Link>
    </main>
  );
}
