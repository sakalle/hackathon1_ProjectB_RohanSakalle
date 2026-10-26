import { NextResponse } from "next/server";
import { createAlert, deleteAlert } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { searchId?: string; offerId?: string; targetPrice?: number; email?: string };
    if (!body.searchId || body.targetPrice == null) throw new Error("Add a target price.");
    createAlert(body.searchId, Number(body.targetPrice), body.email, body.offerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the alert.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Missing alert." }, { status: 400 });
  deleteAlert(body.id);
  return NextResponse.json({ ok: true });
}
