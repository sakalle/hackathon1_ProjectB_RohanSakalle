import { NextResponse } from "next/server";
import { answerTripQuestion } from "@/lib/assistant";
import { currentUser } from "@/lib/auth";
import { addChat, getSummary, listChat, listLoyalty, listSearches } from "@/lib/db";
import { programById } from "@/lib/programs";

export async function GET() {
  const owner = ownerId();
  return NextResponse.json({ messages: listChat(owner) });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string };
    const message = body.message?.trim().slice(0, 500) ?? "";
    if (message.length < 2) return NextResponse.json({ error: "Ask a little more than that." }, { status: 400 });
    const owner = ownerId();
    const user = currentUser();
    const latest = listSearches(1)[0];
    const best = latest?.offers.find((offer) => offer.recommended) ?? latest?.offers.find((offer) => !offer.locked);
    const summary = getSummary();
    const reply = answerTripQuestion(message, {
      name: user?.name ?? null,
      signedIn: Boolean(user),
      balances: listLoyalty()
        .map((row) => {
          const program = programById(row.program_id);
          if (!program || row.balance <= 0) return null;
          return { name: program.name, balance: row.balance, unit: program.unit };
        })
        .filter((row): row is { name: string; balance: number; unit: string } => Boolean(row)),
      latest: latest
        ? {
            title: latest.title,
            normal: latest.normalPrice,
            hacked: latest.bestPrice,
            save: latest.savingsEur,
            offer: best?.title ?? "the normal fare",
          }
        : null,
      bookedSavings: summary.bookedSavings,
      bookings: summary.bookings,
    });
    addChat(owner, "user", message);
    addChat(owner, "assistant", reply);
    return NextResponse.json({ reply, messages: listChat(owner) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not answer.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function ownerId() {
  const user = currentUser();
  if (user) return user.id;
  return "guest";
}
