import { NextResponse } from "next/server";
import { deleteSaved, saveTrip } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { searchId?: string; offerId?: string };
    if (!body.searchId || !body.offerId) throw new Error("Missing trip.");
    saveTrip(body.searchId, body.offerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Missing trip." }, { status: 400 });
  deleteSaved(body.id);
  return NextResponse.json({ ok: true });
}
