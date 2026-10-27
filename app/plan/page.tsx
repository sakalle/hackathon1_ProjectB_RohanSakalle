import { PlanForm } from "@/components/PlanForm";
import { addDays, todayISO } from "@/lib/dates";

export default function PlanPage() {
  const start = addDays(todayISO(), 21);
  const next = addDays(start, 4);
  return (
    <main className="mx-auto grid max-w-3xl gap-8 px-4 py-10 md:px-6 md:py-14">
      <div>
        <p className="eyebrow">Full trip plan</p>
        <h1 className="mt-3 font-serif text-5xl">Several stops. One saving.</h1>
        <p className="mt-3 text-mute">
          Miles are spent on the flights where they buy the most cash. The other flights stay as paid tickets. An open jaw is welcome.
        </p>
      </div>
      <div className="border border-line bg-paper p-5 shadow-card md:p-7">
        <PlanForm start={start} next={next} />
      </div>
    </main>
  );
}
