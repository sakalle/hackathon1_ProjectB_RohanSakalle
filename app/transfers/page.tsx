import Link from "next/link";
import { PROGRAMS, TRANSFERS, airlinePrograms, bankPrograms } from "@/lib/programs";

export default function TransfersPage() {
  const airlines = airlinePrograms();
  const banks = bankPrograms();

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:px-6 md:py-14">
      <div>
        <p className="eyebrow">Credit card transfer map</p>
        <h1 className="mt-3 font-serif text-5xl">Move points 1:1, then book the airline.</h1>
        <p className="mt-3 max-w-2xl text-mute">
          Award Travel Finder shows transfer partners as a matrix. Milla uses the same map when it spends your wallet, and only transfers when the redemption is worth it.
        </p>
      </div>
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
