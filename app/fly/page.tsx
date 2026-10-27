import { QuickForm } from "@/components/QuickForm";
import { addDays, todayISO } from "@/lib/dates";
import { listLoyalty } from "@/lib/db";
import { airlinePrograms, programById } from "@/lib/programs";

export default function FlyPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; depart?: string; return?: string };
}) {
  const today = todayISO();
  const defaults = {
    from: (searchParams.from ?? "MAD").toUpperCase(),
    to: (searchParams.to ?? "JFK").toUpperCase(),
    depart: searchParams.depart ?? addDays(today, 30),
    ret: searchParams.return ?? addDays(today, 37),
  };
  const miles = listLoyalty()
    .map((row) => {
      const program = programById(row.program_id);
      if (!program || row.balance <= 0) return null;
      return { name: program.name, balance: row.balance, unit: program.unit };
    })
    .filter((row): row is { name: string; balance: number; unit: string } => Boolean(row));

  return (
    <main className="mx-auto grid max-w-3xl gap-8 px-4 py-10 md:px-6 md:py-14">
      <div>
        <p className="eyebrow">Compare award flights</p>
        <h1 className="mt-3 font-serif text-5xl">Search every program on one route.</h1>
        <p className="mt-3 text-mute">Enter the trip. Milla prices cash, miles, nearby airports and smarter routes together.</p>
      </div>
      <div className="border border-line bg-paper p-5 shadow-card md:p-7">
        <QuickForm defaults={defaults} miles={miles} />
      </div>
      <div>
        <p className="eyebrow">Programs we price</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {airlinePrograms().map((program) => (
            <span key={program.id} className="chip">
              {program.carrier}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
