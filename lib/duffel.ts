import { isIsoDate, todayISO } from "./dates";
import { programBoard } from "./extras";
import type { BuiltSearch, Cabin, FlightSlice, Offer, SearchInput } from "./types";

const EUR_PER: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.18,
  CHF: 1.06,
  CAD: 0.66,
  AUD: 0.6,
  NZD: 0.55,
  SEK: 0.088,
  NOK: 0.086,
  DKK: 0.134,
  PLN: 0.23,
  CZK: 0.04,
  HUF: 0.0025,
  JPY: 0.0061,
  CNY: 0.13,
  HKD: 0.12,
  SGD: 0.7,
  AED: 0.25,
  INR: 0.011,
  BRL: 0.17,
  MXN: 0.046,
  TRY: 0.027,
  ZAR: 0.051,
  KRW: 0.00066,
  THB: 0.027,
  MAD: 0.092,
};

const MODEL_NOTE = "Fares and award prices come from Milla's model";

interface DuffelSegment {
  departing_at?: string;
  arriving_at?: string;
  duration?: string;
  origin?: { iata_code?: string };
  destination?: { iata_code?: string };
  operating_carrier?: { name?: string; iata_code?: string };
  marketing_carrier?: { iata_code?: string };
  marketing_carrier_flight_number?: string;
  operating_carrier_flight_number?: string;
  stops?: { airport?: { iata_code?: string } }[];
}

interface DuffelOffer {
  id?: string;
  total_amount?: string;
  total_currency?: string;
  owner?: { name?: string };
  passenger_identity_documents_required?: boolean;
  passengers?: { id?: string }[];
  slices?: { segments?: DuffelSegment[] }[];
}

export interface DuffelQuote {
  eur: number;
  currency: string;
  amount: string;
  owner: string;
  offerId: string;
  passengerIds: string[];
  documentsRequired: boolean;
  slices: FlightSlice[];
  why: string[];
}

export interface TicketPassenger {
  name: string;
  kind: string;
  bornOn?: string;
  gender?: string;
  title?: string;
  passport?: { number?: string; country?: string; expires?: string };
}

export function duffelConfigured() {
  return Boolean(process.env.DUFFEL_ACCESS_TOKEN?.trim());
}

export async function withDuffel(input: SearchInput, built: BuiltSearch): Promise<BuiltSearch> {
  if (!duffelConfigured()) return built;
  try {
    const quote = await searchDuffel(input);
    if (!quote) {
      return annotate(built, "Duffel returned no fare for these dates, so cash prices on this result are Milla's estimate.");
    }
    return applyLiveFare(built, quote, input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    return annotate(
      built,
      `Duffel could not price this search (${clip(message)}), so cash prices on this result are Milla's estimate.`,
    );
  }
}

export async function createDuffelOrder(args: {
  offer: Offer;
  email: string;
  phone: string;
  passengers: TicketPassenger[];
}): Promise<string> {
  const live = args.offer.live;
  if (!live) throw new Error("This fare is not a live Duffel offer.");
  if (args.passengers.length !== live.passengerIds.length) {
    throw new Error("The traveller count does not match the Duffel fare. Search again.");
  }
  const phone = normalPhone(args.phone);
  const email = args.email.trim();
  const passengers = args.passengers.map((person, index) => passengerRow(person, live.passengerIds[index], email, phone, live.documentsRequired));
  const body = await duffel("/air/orders", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "instant",
        selected_offers: [live.offerId],
        passengers,
        payments: [{ type: "balance", amount: live.amount, currency: live.currency }],
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const order = (body.data ?? {}) as { booking_reference?: string; id?: string };
  const reference = order.booking_reference || order.id;
  if (!reference) throw new Error("Duffel did not return a booking reference.");
  return reference;
}

function applyLiveFare(built: BuiltSearch, quote: DuffelQuote, input: SearchInput): BuiltSearch {
  const normal = quote.eur;
  const kept = built.offers
    .filter((offer) => offer.bookPath !== "cash")
    .map((offer) => rescale(offer, normal))
    .filter((offer): offer is Offer => Boolean(offer));
  for (const offer of kept) offer.recommended = false;
  const usable = kept.filter((offer) => !offer.locked && !offer.weak).sort((a, b) => b.savingsEur - a.savingsEur);
  const weak = kept.filter((offer) => offer.weak && !offer.locked).sort((a, b) => b.savingsEur - a.savingsEur);
  const locked = kept.filter((offer) => offer.locked);
  if (usable[0]) usable[0].recommended = true;
  const liveOffer = quoteToOffer(quote, normal);
  const ordered = [...usable, ...weak, ...locked].slice(0, 7);
  ordered.push(liveOffer);
  const best = ordered.find((offer) => offer.recommended) ?? null;
  const bestPrice = best ? best.hackedPrice : normal;
  const savingsEur = Math.max(0, normal - bestPrice);
  const cashSeats = input.adults + input.children * 0.75;
  const notes = built.notes.filter(
    (note) => !note.startsWith(MODEL_NOTE) && !note.startsWith("The normal fare is already sharp") && !note.startsWith("Cash fares count each child"),
  );
  if (input.children > 0) {
    notes.unshift("The live fare includes the child prices Duffel returned. Award seats still charge full miles for every seat, including children.");
  }
  if (!best) {
    notes.push("The live fare is already sharp. Miles do not beat it by enough to matter.");
  }
  const converted = quote.currency === "EUR" ? "" : ` Duffel priced it at ${quote.amount} ${quote.currency}, converted to euros at a fixed rate.`;
  notes.push(
    `The normal price is a live Duffel fare for these dates.${converted} Miles, taxes, and the award month still come from public charts. The week grid is an estimate. Nearby-airport and date-shift cash hacks are hidden here so they are not compared with the live fare.`,
  );
  return {
    ...built,
    normalPrice: normal,
    bestPrice,
    savingsEur,
    savingsPct: normal ? (savingsEur / normal) * 100 : 0,
    offers: ordered,
    programBoard: programBoard(input.legs, input.cabin, Math.round(normal / Math.max(1, cashSeats))),
    notes,
  };
}

async function searchDuffel(input: SearchInput): Promise<DuffelQuote | null> {
  const cabin = cabinClass(input.cabin);
  const passengers = [
    ...Array.from({ length: input.adults }, () => ({ type: "adult" })),
    ...Array.from({ length: input.children }, () => ({ age: 8 })),
  ];
  const body = await duffel("/air/offer_requests?return_offers=true&supplier_timeout=12000", {
    method: "POST",
    body: JSON.stringify({
      data: {
        cabin_class: cabin,
        supplier_timeout: 12000,
        slices: input.legs.map((leg) => ({
          origin: leg.origin,
          destination: leg.destination,
          departure_date: leg.date,
        })),
        passengers,
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const offers = ((body.data as { offers?: DuffelOffer[] } | undefined)?.offers ?? []) as DuffelOffer[];
  if (!offers.length) return null;
  let best: { eur: number; offer: DuffelOffer } | null = null;
  const unseen = new Set<string>();
  for (const offer of offers) {
    const currency = offer.total_currency ?? "";
    const rate = EUR_PER[currency];
    const amount = Number(offer.total_amount);
    if (!rate || !Number.isFinite(amount)) {
      if (currency) unseen.add(currency);
      continue;
    }
    const eur = Math.max(1, Math.round(amount * rate));
    if (!best || eur < best.eur) best = { eur, offer };
  }
  if (!best) {
    throw new Error(`priced in ${[...unseen].join(", ") || "an unknown currency"}, which this app does not convert`);
  }
  return quoteFrom(best.offer, best.eur, input.cabin);
}

function quoteFrom(offer: DuffelOffer, eur: number, cabin: Cabin): DuffelQuote {
  const slices: FlightSlice[] = [];
  const why: string[] = [];
  for (const slice of offer.slices ?? []) {
    for (const segment of slice.segments ?? []) {
      const mapped = mapSegment(segment, cabin);
      if (!mapped) continue;
      slices.push(mapped.slice);
      why.push(mapped.line);
    }
  }
  if (!slices.length || !offer.id) throw new Error("Duffel returned a fare without flights.");
  const passengerIds = (offer.passengers ?? []).map((person) => person.id).filter((id): id is string => Boolean(id));
  if (!passengerIds.length) throw new Error("Duffel returned a fare without passengers.");
  const owner = offer.owner?.name || slices[0].carrier;
  why.unshift(`${owner} is the operating carrier on this Duffel fare. The price is the cheapest offer returned for the dates you asked for.`);
  return {
    eur,
    currency: offer.total_currency || "EUR",
    amount: offer.total_amount || String(eur),
    owner,
    offerId: offer.id,
    passengerIds,
    documentsRequired: Boolean(offer.passenger_identity_documents_required),
    slices,
    why,
  };
}

function quoteToOffer(quote: DuffelQuote, normal: number): Offer {
  const money = quote.currency === "EUR" ? "" : ` Duffel charged ${quote.amount} ${quote.currency}. The euro figure uses a fixed conversion.`;
  return {
    id: "duffel-cash",
    strategy: "live_cash",
    eyebrow: "Live cash",
    title: quote.owner,
    summary: `This is the live cash fare for the airports and dates you asked for.${money} Award options above it are still chart prices, measured against this fare.`,
    why: quote.why,
    slices: quote.slices,
    cashOutOfPocket: normal,
    points: [],
    normalPrice: normal,
    hackedPrice: normal,
    savingsEur: 0,
    savingsPct: 0,
    centsPerPoint: null,
    bookPath: "cash",
    guide: [
      { title: "Check the live fare", detail: `${quote.owner}, priced by Duffel for this search.` },
      { title: "Enter the travellers", detail: "First and last name, date of birth, and a phone number with the country code. They are sent to Duffel with the order." },
      { title: "Confirm in Milla", detail: "The demo card is checked here and is not sent to Duffel. The order is paid from the Duffel test balance." },
      { title: "Keep the reference", detail: "The confirmation code is the Duffel booking reference, not a Milla placeholder." },
    ],
    tags: ["Duffel"],
    recommended: false,
    locked: false,
    weak: false,
    live: {
      offerId: quote.offerId,
      passengerIds: quote.passengerIds,
      currency: quote.currency,
      amount: quote.amount,
      owner: quote.owner,
      documentsRequired: quote.documentsRequired,
    },
  };
}

function rescale(offer: Offer, normal: number): Offer | null {
  const savings = normal - offer.hackedPrice;
  if (savings < 12) return null;
  return {
    ...offer,
    normalPrice: normal,
    savingsEur: savings,
    savingsPct: (savings / normal) * 100,
    recommended: false,
  };
}

function mapSegment(segment: DuffelSegment, cabin: Cabin): { slice: FlightSlice; line: string } | null {
  const from = segment.origin?.iata_code ?? "";
  const to = segment.destination?.iata_code ?? "";
  const departAt = segment.departing_at ?? "";
  const arriveAt = segment.arriving_at ?? "";
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to) || departAt.length < 16 || arriveAt.length < 16) return null;
  const date = departAt.slice(0, 10);
  const arriveDate = arriveAt.slice(0, 10);
  const carrierName = segment.operating_carrier?.name || "Airline";
  const flight = `${segment.marketing_carrier?.iata_code ?? segment.operating_carrier?.iata_code ?? ""}${segment.marketing_carrier_flight_number ?? segment.operating_carrier_flight_number ?? ""}`;
  const via = (segment.stops ?? []).map((stop) => stop.airport?.iata_code).filter((code): code is string => Boolean(code));
  return {
    slice: {
      from,
      to,
      date,
      carrier: flight ? `${carrierName} ${flight}` : carrierName,
      cabin,
      depart: departAt.slice(11, 16),
      arrive: arriveAt.slice(11, 16),
      nextDay: arriveDate > date,
      durationMin: durationMin(segment.duration),
      stops: via.length,
      via,
      award: false,
    },
    line: `${carrierName}${flight ? ` ${flight}` : ""} ${from} ${departAt.slice(11, 16)} → ${to} ${arriveAt.slice(11, 16)}.`,
  };
}

function passengerRow(person: TicketPassenger, id: string, email: string, phone: string, documentsRequired: boolean) {
  const { given, family } = splitName(person.name);
  const born = person.bornOn ?? "";
  if (!isIsoDate(born)) throw new Error("Each traveller needs a date of birth.");
  const age = ageOn(born, todayISO());
  const child = person.kind.toLowerCase().startsWith("child");
  if (child && (age < 2 || age > 11)) throw new Error("A child on this live fare must be 2 to 11 years old. The search priced children as age 8.");
  if (!child && age < 18) throw new Error("An adult on this live fare must be 18 or over.");
  if (person.gender !== "m" && person.gender !== "f") throw new Error("Choose male or female for each traveller. Duffel requires it on the ticket.");
  const title = ["mr", "ms", "mrs", "miss", "dr"].includes(person.title ?? "") ? person.title : person.gender === "f" ? "ms" : "mr";
  const row: Record<string, unknown> = {
    id,
    given_name: given,
    family_name: family,
    born_on: born,
    gender: person.gender,
    title,
    email,
    phone_number: phone,
  };
  if (documentsRequired) {
    const country = (person.passport?.country ?? "").trim().toUpperCase();
    const expires = person.passport?.expires ?? "";
    const number = (person.passport?.number ?? "").replace(/\s+/g, "");
    if (!/^[A-Z]{2}$/.test(country)) throw new Error("Passport country should be two letters, such as ES.");
    if (!isIsoDate(expires) || expires <= todayISO()) throw new Error("The passport needs an expiry date after today.");
    if (!/^[A-Za-z0-9]{5,20}$/.test(number)) throw new Error("Add the passport number.");
    row.identity_documents = [
      { type: "passport", unique_identifier: number, issuing_country_code: country, expires_on: expires },
    ];
  }
  return row;
}

async function duffel(path: string, init: RequestInit) {
  const token = process.env.DUFFEL_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("Duffel is not configured.");
  const response = await fetch(`https://api.duffel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Duffel-Version": "v2",
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: { errors?: { message?: string; code?: string }[]; data?: unknown } = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`Duffel returned ${response.status}.`);
    }
  }
  if (!response.ok) {
    const message = body.errors?.map((error) => error.message).filter(Boolean).join(" ");
    const expired = body.errors?.some((error) => error.code === "offer_no_longer_available");
    if (expired) throw new Error("That live fare expired. Search again and book the new price.");
    throw new Error(message || `Duffel returned ${response.status}.`);
  }
  return body;
}

function annotate(built: BuiltSearch, line: string): BuiltSearch {
  if (built.notes.includes(line)) return built;
  return { ...built, notes: [...built.notes, line] };
}

function cabinClass(cabin: Cabin) {
  if (cabin === "premium") return "premium_economy";
  if (cabin === "business") return "business";
  return "economy";
}

function durationMin(value?: string) {
  if (!value) return 0;
  const match = /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?/.exec(value);
  if (!match) return 0;
  return Number(match[1] || 0) * 24 * 60 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2 || parts.some((part) => part.length < 1)) {
    throw new Error("Each traveller needs a first and last name.");
  }
  return { given: parts.slice(0, -1).join(" "), family: parts[parts.length - 1] };
}

function normalPhone(value: string) {
  const compact = value.replace(/[\s()-]/g, "");
  const phone = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    throw new Error("Use a phone number with the country code, such as +34600000000.");
  }
  return phone;
}

function ageOn(born: string, on: string) {
  const [by, bm, bd] = born.split("-").map(Number);
  const [oy, om, od] = on.split("-").map(Number);
  let age = oy - by;
  if (om < bm || (om === bm && od < bd)) age -= 1;
  return age;
}

function clip(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > 160 ? `${clean.slice(0, 157)}…` : clean;
}
