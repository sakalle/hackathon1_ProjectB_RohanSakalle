import Link from "next/link";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="mx-auto grid max-w-xl gap-6 px-4 py-12 md:py-16">
      <div className="rise">
        <p className="eyebrow">Optional</p>
        <h1 className="mt-3 font-serif text-5xl">Sign in</h1>
        <p className="mt-3 text-mute">
          Name, email, and a password. The same email signs you back in. Search, the wallet, and booking still work as a guest.
        </p>
      </div>
      {searchParams.error && <p className="border border-line bg-paper px-4 py-3 text-sm">{searchParams.error}</p>}
      <form action="/api/auth/login" method="post" className="rise grid gap-4 border border-line bg-paper p-5">
        <label>
          <span className="eyebrow">Name</span>
          <input className="field mt-2" name="name" required autoComplete="name" />
        </label>
        <label>
          <span className="eyebrow">Email</span>
          <input className="field mt-2" type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          <span className="eyebrow">Password</span>
          <input className="field mt-2" type="password" name="password" required minLength={6} autoComplete="current-password" />
        </label>
        <button className="btn" type="submit">
          Continue
        </button>
      </form>
      <Link href="/" className="text-copper">
        Continue as a guest
      </Link>
    </main>
  );
}
