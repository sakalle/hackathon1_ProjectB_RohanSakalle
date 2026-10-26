import { NextResponse } from "next/server";
import { applySampleWallet, listLoyalty, saveWallet, setProfileName } from "@/lib/db";
import { programById } from "@/lib/programs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sample?: boolean;
      name?: string;
      entries?: { programId: string; balance: number }[];
    };
    if (typeof body.name === "string") setProfileName(body.name);
    if (body.sample) {
      applySampleWallet();
      return NextResponse.json({ loyalty: listLoyalty() });
    }
    const entries = (body.entries ?? []).filter((entry) => programById(entry.programId));
    saveWallet(entries);
    return NextResponse.json({ loyalty: listLoyalty() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the wallet.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
