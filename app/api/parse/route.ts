import { NextResponse } from "next/server";
import { parseTripText } from "@/lib/parse";

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: string };
  const text = body.text?.trim() ?? "";
  if (text.length < 4) return NextResponse.json({ error: "Paste a link or a sentence with cities and dates." }, { status: 400 });
  return NextResponse.json(parseTripText(text.slice(0, 4000)));
}
