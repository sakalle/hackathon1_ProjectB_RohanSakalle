import { NextResponse } from "next/server";
import { createBooking } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      searchId?: string;
      offerId?: string;
      email?: string;
      passengers?: { name: string; kind: string }[];
      cardNumber?: string;
    };
    if (!body.searchId || !body.offerId || !body.email || !body.passengers) throw new Error("The booking is incomplete.");
    const booking = createBooking({
      searchId: body.searchId,
      offerId: body.offerId,
      email: body.email,
      passengers: body.passengers,
      cardNumber: body.cardNumber,
    });
    return NextResponse.json({ id: booking.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not book.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
