"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PROGRAMS, TRANSFERS, programById } from "@/lib/programs";

export function WalletManager({
  name,
  balances,
}: {
  name: string;
  balances: Record<string, number>;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(name);
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const program of PROGRAMS) initial[program.id] = balances[program.id] ?? 0;
    return initial;
  });
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function save(sample = false) {
    setPending(true);
    setMessage("");
    const response = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profile,
        sample,
        entries: sample ? undefined : PROGRAMS.map((program) => ({ programId: program.id, balance: values[program.id] ?? 0 })),
      }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not save.");
      return;
    }
    if (sample) {
      const next: Record<string, number> = {};
      for (const program of PROGRAMS) next[program.id] = 0;
      for (const row of data.loyalty as { program_id: string; balance: number }[]) next[row.program_id] = row.balance;
      setValues(next);
    }
    setMessage(sample ? "Sample wallet loaded. Search again to spend it." : "Wallet saved.");
    router.refresh();
  }

  const airlines = PROGRAMS.filter((program) => program.kind === "airline");
  const banks = PROGRAMS.filter((program) => program.kind === "bank");

  return (
    <div className="grid gap-8">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label>
          <span className="eyebrow">Your name</span>
          <input className="field mt-2" value={profile} onChange={(event) => setProfile(event.target.value)} />
        </label>
        <button type="button" className="btn-ghost" disabled={pending} onClick={() => save(true)}>
          Load a sample wallet
        </button>
      </div>
      <section>
        <h2 className="font-serif text-3xl">Airline miles</h2>
        <div className="mt-4 grid gap-3">
          {airlines.map((program) => (
            <BalanceRow
              key={program.id}
              label={program.name}
              unit={program.unit}
              value={values[program.id] ?? 0}
              onChange={(balance) => setValues((current) => ({ ...current, [program.id]: balance }))}
            />
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-serif text-3xl">Bank points</h2>
        <p className="mt-2 max-w-2xl text-mute">These move 1:1 into airline programs. Milla spends them only when the redemption is worth at least 0.8 cents.</p>
        <div className="mt-4 grid gap-3">
          {banks.map((program) => (
            <div key={program.id} className="border border-line bg-paper p-4">
              <BalanceRow
                label={program.name}
                unit={program.unit}
                value={values[program.id] ?? 0}
                onChange={(balance) => setValues((current) => ({ ...current, [program.id]: balance }))}
              />
              <p className="mt-3 text-sm text-mute">
                Transfers to {(TRANSFERS[program.id] ?? []).map((id) => programById(id)?.name).filter(Boolean).join(", ")}.
              </p>
            </div>
          ))}
        </div>
      </section>
      {message && <p className="text-sm">{message}</p>}
      <button type="button" className="btn" disabled={pending} onClick={() => save(false)}>
        {pending ? "Saving…" : "Save wallet"}
      </button>
    </div>
  );
}

function BalanceRow({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid items-center gap-3 sm:grid-cols-[1fr_180px]">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="text-sm text-mute">{unit}</span>
      </span>
      <input
        className="field"
        type="number"
        min={0}
        step={500}
        value={value || ""}
        placeholder="0"
        onChange={(event) => onChange(Number(event.target.value || 0))}
      />
    </label>
  );
}
