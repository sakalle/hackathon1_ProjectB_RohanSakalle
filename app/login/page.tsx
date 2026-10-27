import Link from "next/link";
import { googleReady } from "@/lib/auth";

const reasons: Record<string, string> = {
  email: "Enter the Google ID as an email, such as name@gmail.com.",
  denied: "Google was closed before it finished. Enter the Google ID below, or stay a guest.",
  state: "That sign-in attempt expired. Enter the Google ID again.",
  google: "Google did not confirm the account. Enter the Google ID below, or stay a guest.",
  config: "Enter the Google ID below. Search still works if you skip this.",
};

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const ready = googleReady();
  const error = searchParams.error ? reasons[searchParams.error] : null;

  return (
    <main className="mx-auto grid max-w-xl gap-6 px-4 py-12 md:py-16">
      <div>
        <p className="eyebrow">Optional</p>
        <h1 className="mt-3 font-serif text-5xl">Sign in with Google</h1>
        <p className="mt-3 text-mute">
          Enter the Google ID for this browser. Search, the wallet, bookings, and Ask Milla all work if you skip this.
        </p>
      </div>
      {error && <p className="border border-line bg-paper px-4 py-3 text-sm">{error}</p>}
      <form action="/api/auth/google-id" method="post" className="grid gap-4 border border-line bg-paper p-5">
        <label>
          <span className="eyebrow">Google ID</span>
          <input className="field mt-2" type="email" name="email" required placeholder="name@gmail.com" autoComplete="email" />
        </label>
        <button className="btn" type="submit">
          Continue
        </button>
      </form>
      {ready && (
        <a href="/api/auth/google" className="text-sm text-copper">
          Use the Google account popup instead
        </a>
      )}
      <Link href="/" className="text-copper">
        Continue as a guest
      </Link>
    </main>
  );
}
