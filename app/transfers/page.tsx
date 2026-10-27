import Link from "next/link";
import { BANK_CARDS, PROGRAMS, TRANSFERS, airlinePrograms, bankPrograms } from "@/lib/programs";

export default function TransfersPage() {
  const airlines = airlinePrograms();
  const banks = bankPrograms();

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:px-6 md:py-14">
      <div>
        <p className="eyebrow">Credit card transfer map</p>
        <h1 className="mt-3 font-serif text-5xl">Move points 1:1, then book the airline.</h1>
        <p className="mt-3 max-w-2xl text-mute">
          The cards below earn the points. The grid moves those points into an airline at 1:1. Milla only suggests the transfer when the redemption is worth it.
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        {banks.map((bank) => (
          <article key={bank.id} className="border border-line bg-paper p-5">
            <p className="eyebrow">{bank.carrier}</p>
            <h2 className="mt-2 font-serif text-3xl">{bank.name}</h2>
            <ul className="mt-4 grid gap-3">
              {(BANK_CARDS[bank.id] ?? []).map((card) => (
                <li key={card.name} className="border border-line bg-cream px-3 py-3">
                  <p className="font-medium">{card.name}</p>
                  <p className="mt-1 text-sm text-mute">Earns {bank.unit}. {card.earn}.</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <p className="text-sm text-mute">These are typical published US card rates, not a live offer. A European card with the same name can earn differently.</p>
      <div className="overflow-x-auto border border-line bg-paper">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/60">
              <th className="px-3 py-3">Airline</th>
              {banks.map((bank) => (
                <th key={bank.id} className="px-3 py-3">
                  {bank.name.replace(" Membership Rewards", "").replace(" Ultimate Rewards", "").replace(" ThankYou", "").replace(" Miles", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {airlines.map((airline) => (
              <tr key={airline.id} className="border-b border-line/70">
                <td className="px-3 py-3 font-medium">
                  {airline.carrier}
                  <span className="mt-0.5 block text-xs text-mute">{airline.unit}</span>
                </td>
                {banks.map((bank) => {
                  const yes = (TRANSFERS[bank.id] ?? []).includes(airline.id);
                  return (
                    <td key={bank.id} className={`px-3 py-3 ${yes ? "bg-[#f4e4d2] text-copper" : "text-mute/50"}`}>
                      {yes ? "1 : 1" : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-mute">
        {PROGRAMS.filter((program) => program.kind === "bank").length} banks · {airlines.length} airlines.{" "}
        <Link href="/wallet" className="text-copper">
          Put balances in the wallet
        </Link>{" "}
        so searches can spend them.
      </p>
    </main>
  );
}
