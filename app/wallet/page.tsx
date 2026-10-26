import { WalletManager } from "@/components/WalletManager";
import { getProfile, listLoyalty } from "@/lib/db";

export default function WalletPage() {
  const profile = getProfile();
  const balances: Record<string, number> = {};
  for (const row of listLoyalty()) balances[row.program_id] = row.balance;
  return (
    <main className="mx-auto grid max-w-3xl gap-8 px-4 py-10 md:px-6 md:py-14">
      <div>
        <p className="eyebrow">Miles and points</p>
        <h1 className="mt-3 font-serif text-5xl">What you already have.</h1>
        <p className="mt-3 text-mute">
          Award savings only count when the miles are in this wallet, or one transfer away. A balance of zero is not a discount.
        </p>
      </div>
      <WalletManager name={profile.name} balances={balances} />
    </main>
  );
}
