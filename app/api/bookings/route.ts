import { NextResponse } from "next/server";
import { assertBookingInput, createBooking, findBooking, getSearch } from "@/lib/db";
import { createDuffelOrder, type TicketPassenger } from "@/lib/duffel";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      searchId?: string;
      offerId?: string;
      email?: string;
      phone?: string;
      passengers?: TicketPassenger[];
      cardNumber?: string;
    };
    if (!body.searchId || !body.offerId || !body.email || !body.passengers) throw new Error("The booking is incomplete.");
    const already = findBooking(body.searchId, body.offerId);
    if (already) return NextResponse.json({ id: already.id });
    assertBookingInput({
      searchId: body.searchId,
      offerId: body.offerId,
      email: body.email,
      passengers: body.passengers,
      cardNumber: body.cardNumber,
    });
    const search = getSearch(body.searchId);
    const offer = search?.offers.find((item) => item.id === body.offerId);
    let confirmation: string | undefined;
    if (offer?.live) {
      confirmation = await createDuffelOrder({
        offer,
        email: body.email,
        phone: body.phone ?? "",
        passengers: body.passengers,
      });
    }
    const booking = createBooking({
      searchId: body.searchId,
      offerId: body.offerId,
      email: body.email,
      passengers: body.passengers,
      cardNumber: body.cardNumber,
      confirmation,
    });
    return NextResponse.json({ id: booking.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not book.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
