import { airportByCode, distanceKm, hasNonstop, requireAirport } from "./airports";
import { addDays, dowOf, hhmm, monthOf, unitHash } from "./dates";
import { FLAG_CARRIER, HUB_CARRIER, PROGRAMS, SWEET_HUBS, programById } from "./programs";
import type { Cabin, FlightSlice } from "./types";

const CHARTS: Record<string, { maxKm: number; eco: number }[]> = {
  iberia: [
    { maxKm: 650, eco: 6500 },
    { maxKm: 1400, eco: 10500 },
    { maxKm: 2500, eco: 15000 },
    { maxKm: 4500, eco: 22000 },
    { maxKm: 7000, eco: 34000 },
    { maxKm: 10000, eco: 42500 },
    { maxKm: 20000, eco: 51000 },
  ],
  ba: [
    { maxKm: 650, eco: 9750 },
    { maxKm: 1400, eco: 15500 },
    { maxKm: 2500, eco: 20000 },
    { maxKm: 4500, eco: 30000 },
    { maxKm: 7000, eco: 50000 },
    { maxKm: 10000, eco: 60000 },
    { maxKm: 20000, eco: 70000 },
  ],
  flyingblue: [
    { maxKm: 1200, eco: 12000 },
    { maxKm: 2400, eco: 20000 },
    { maxKm: 4800, eco: 35000 },
    { maxKm: 7500, eco: 45000 },
    { maxKm: 11000, eco: 65000 },
    { maxKm: 20000, eco: 80000 },
  ],
  mnm: [
    { maxKm: 1200, eco: 18000 },
    { maxKm: 2400, eco: 35000 },
    { maxKm: 5000, eco: 56000 },
    { maxKm: 8000, eco: 71000 },
    { maxKm: 20000, eco: 85000 },
  ],
  aeroplan: [
    { maxKm: 1200, eco: 10000 },
    { maxKm: 2500, eco: 17500 },
    { maxKm: 5000, eco: 35000 },
    { maxKm: 8000, eco: 45000 },
    { maxKm: 12000, eco: 55000 },
    { maxKm: 20000, eco: 70000 },
  ],
  virgin: [
    { maxKm: 1500, eco: 10000 },
    { maxKm: 4000, eco: 20000 },
    { maxKm: 7000, eco: 30000 },
    { maxKm: 20000, eco: 45000 },
  ],
  aa: [
    { maxKm: 1200, eco: 12000 },
    { maxKm: 2500, eco: 17500 },
    { maxKm: 5000, eco: 30000 },
    { maxKm: 8000, eco: 45000 },
    { maxKm: 20000, eco: 57500 },
  ],
  united: [
    { maxKm: 1200, eco: 15000 },
    { maxKm: 2500, eco: 22000 },
    { maxKm: 5000, eco: 40000 },
    { maxKm: 8000, eco: 55000 },
    { maxKm: 20000, eco: 70000 },
  ],
  turkish: [
    { maxKm: 1500, eco: 10000 },
    { maxKm: 3000, eco: 15000 },
    { maxKm: 5000, eco: 25000 },
    { maxKm: 8000, eco: 45000 },
    { maxKm: 20000, eco: 60000 },
  ],
  qatar: [
    { maxKm: 1200, eco: 9000 },
    { maxKm: 2500, eco: 16000 },
    { maxKm: 5000, eco: 32000 },
    { maxKm: 8000, eco: 43000 },
    { maxKm: 20000, eco: 55000 },
  ],
};

export function carrierFor(fromCode: string, toCode: string) {
  const from = requireAirport(fromCode);
  const to = requireAirport(toCode);
  return FLAG_CARRIER[from.country] || FLAG_CARRIER[to.country] || "Scheduled airline";
}

export function segmentFare(fromCode: string, toCode: string, date: string, cabin: Cabin, today: string) {
  const from = requireAirport(fromCode);
  const to = requireAirport(toCode);
  const km = distanceKm(from, to);
  let base =
    km < 1500 ? Math.max(49, 32 + km * 0.108) : km < 4000 ? Math.max(120, km * 0.09) : Math.max(340, km * 0.084);
  base *= seasonFactor(date) * dowFactor(date) * advanceFactor(date, today) * cabinFactor(cabin);
  base *= 0.9 + unitHash(`${from.iata}|${to.iata}|${date}|${cabin}`) * 0.22;
  return Math.max(39, Math.round(base));
}

function seasonFactor(iso: string) {
  const month = monthOf(iso);
  if (month === 7 || month === 8) return 1.32;
  if (month === 6 || month === 9) return 1.16;
  if (month === 12 || month === 1) return 1.14;
  if (month === 3 || month === 4 || month === 10) return 1.04;
  if (month === 2 || month === 11) return 0.86;
  return 0.96;
}

function dowFactor(iso: string) {
  const dow = dowOf(iso);
  if (dow === 2 || dow === 3) return 0.9;
  if (dow === 5 || dow === 0) return 1.12;
  if (dow === 6) return 1.05;
  if (dow === 1) return 0.96;
  return 1;
}

function advanceFactor(iso: string, today: string) {
  const days = Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  if (days < 3) return 1.65;
  if (days < 10) return 1.38;
  if (days < 21) return 1.16;
  if (days > 180) return 0.9;
  if (days > 100) return 0.95;
  return 1;
}

function cabinFactor(cabin: Cabin) {
  if (cabin === "premium") return 1.58;
  if (cabin === "business") return 2.75;
  return 1;
}

export interface PricedLeg {
  from: string;
  to: string;
  date: string;
  price: number;
  slices: FlightSlice[];
  kind: "nonstop" | "connect" | "sweet" | "split";
  via: string[];
  carrier: string;
}

const pricedLegCache = new Map<string, PricedLeg>();

export function publishedLeg(from: string, to: string, date: string, cabin: Cabin, today: string): PricedLeg {
  const key = `${from}|${to}|${date}|${cabin}|${today}`;
  const cached = pricedLegCache.get(key);
  if (cached) return cached;
  const priced = pricePublishedLeg(from, to, date, cabin, today);
  if (pricedLegCache.size > 3000) pricedLegCache.clear();
  pricedLegCache.set(key, priced);
  return priced;
}

function pricePublishedLeg(from: string, to: string, date: string, cabin: Cabin, today: string): PricedLeg {
  const origin = requireAirport(from);
  const dest = requireAirport(to);
  if (hasNonstop(origin, dest)) {
    const price = segmentFare(from, to, date, cabin, today);
    return {
      from,
      to,
      date,
      price,
      slices: [buildSlice(from, to, date, cabin, carrierFor(from, to), false, `${from}${to}${date}`)],
      kind: "nonstop",
      via: [],
      carrier: carrierFor(from, to),
    };
  }
  const connected = bestConnection(from, to, date, cabin, today, 0.8, "connect");
  if (connected) return connected;
  const price = Math.round(segmentFare(from, to, date, cabin, today) * 1.12);
  return {
    from,
    to,
    date,
    price,
    slices: [buildSlice(from, to, date, cabin, carrierFor(from, to), false, `${from}${to}${date}`, ["connection"])],
    kind: "connect",
    via: [],
    carrier: carrierFor(from, to),
  };
}

export function sweetLeg(from: string, to: string, date: string, cabin: Cabin, today: string): PricedLeg | null {
  const direct = publishedLeg(from, to, date, cabin, today);
  let best: PricedLeg | null = null;
  for (const hub of SWEET_HUBS) {
    if (hub === from || hub === to) continue;
    const hubAirport = airportByCode(hub);
    const origin = requireAirport(from);
    const dest = requireAirport(to);
    if (!hubAirport) continue;
    const directKm = distanceKm(origin, dest);
    const viaKm = distanceKm(origin, hubAirport) + distanceKm(hubAirport, dest);
    if (directKm > 0 && viaKm / directKm > 1.55) continue;
    const priced = connectionThrough(from, hub, to, date, cabin, today, 0.64, "sweet", HUB_CARRIER[hub] || "Connecting airline");
    if (!priced) continue;
    if (priced.price + 25 >= direct.price) continue;
    if (!best || priced.price < best.price) best = priced;
  }
  return best;
}

export function splitLeg(from: string, to: string, date: string, cabin: Cabin, today: string): PricedLeg | null {
  const direct = publishedLeg(from, to, date, cabin, today);
  let best: PricedLeg | null = null;
  for (const hub of SWEET_HUBS) {
    if (hub === from || hub === to) continue;
    const origin = requireAirport(from);
    const dest = requireAirport(to);
    const hubAirport = requireAirport(hub);
    if (!hasNonstop(origin, hubAirport) || !hasNonstop(hubAirport, dest)) continue;
    const viaKm = distanceKm(origin, hubAirport) + distanceKm(hubAirport, dest);
    if (distanceKm(origin, dest) > 0 && viaKm / distanceKm(origin, dest) > 1.45) continue;
    const first = segmentFare(from, hub, date, cabin, today);
    const secondDate = date;
    const second = segmentFare(hub, to, secondDate, cabin, today);
    const price = first + second;
    if (price + 40 >= direct.price) continue;
    const firstSlice = buildSlice(from, hub, date, cabin, carrierFor(from, hub), false, `split1${from}${hub}${date}`);
    const departMinutes = toMinutes(firstSlice.depart) + firstSlice.durationMin + 150;
    const landed = hhmm(departMinutes);
    const secondDay = addDays(date, landed.dayShift);
    const secondSlice = buildSlice(hub, to, secondDay, cabin, carrierFor(hub, to), false, `split2${hub}${to}${date}`);
    const candidate: PricedLeg = {
      from,
      to,
      date,
      price,
      slices: [firstSlice, { ...secondSlice, date: secondDay }],
      kind: "split",
      via: [hub],
      carrier: "Two tickets",
    };
    if (!best || candidate.price < best.price) best = candidate;
  }
  return best;
}

function bestConnection(
  from: string,
  to: string,
  date: string,
  cabin: Cabin,
  today: string,
  factor: number,
  kind: PricedLeg["kind"],
): PricedLeg | null {
  let best: PricedLeg | null = null;
  for (const hub of SWEET_HUBS) {
    if (hub === from || hub === to) continue;
    const hubAirport = requireAirport(hub);
    const origin = requireAirport(from);
    const dest = requireAirport(to);
    const directKm = Math.max(1, distanceKm(origin, dest));
    const viaKm = distanceKm(origin, hubAirport) + distanceKm(hubAirport, dest);
    if (viaKm / directKm > 1.7) continue;
    const priced = connectionThrough(from, hub, to, date, cabin, today, factor, kind, HUB_CARRIER[hub] || carrierFor(from, to));
    if (!priced) continue;
    if (!best || priced.price < best.price) best = priced;
  }
  return best;
}

function connectionThrough(
  from: string,
  hub: string,
  to: string,
  date: string,
  cabin: Cabin,
  today: string,
  factor: number,
  kind: PricedLeg["kind"],
  carrier: string,
): PricedLeg | null {
  const first = segmentFare(from, hub, date, cabin, today);
  const second = segmentFare(hub, to, date, cabin, today);
  const price = Math.round((first + second) * factor);
  const firstSlice = buildSlice(from, hub, date, cabin, carrier, false, `${kind}${from}${hub}${date}`);
  const layover = 75 + Math.floor(unitHash(`${from}${hub}${to}${date}`) * 80);
  const secondStart = toMinutes(firstSlice.depart) + firstSlice.durationMin + layover;
  const secondClock = hhmm(secondStart);
  const secondDate = addDays(date, secondClock.dayShift);
  const duration = Math.max(55, Math.round(distanceKm(requireAirport(hub), requireAirport(to)) / 13.5) + 30);
  const arrive = hhmm(secondStart + duration);
  const secondSlice: FlightSlice = {
    from: hub,
    to,
    date: secondDate,
    carrier,
    cabin,
    depart: secondClock.time,
    arrive: arrive.time,
    nextDay: arrive.dayShift > secondClock.dayShift,
    durationMin: duration,
    stops: 0,
    via: [],
    award: false,
  };
  return {
    from,
    to,
    date,
    price,
    slices: [{ ...firstSlice, via: [hub] }, secondSlice],
    kind,
    via: [hub],
    carrier,
  };
}

export function buildSlice(
  from: string,
  to: string,
  date: string,
  cabin: Cabin,
  carrier: string,
  award: boolean,
  salt: string,
  via: string[] = [],
): FlightSlice {
  const km = distanceKm(requireAirport(from), requireAirport(to));
  const durationMin = Math.max(50, Math.round(km / 13.5) + 28);
  const start = 6 * 60 + Math.floor(unitHash(salt) * 13.5 * 60);
  const depart = hhmm(start);
  const arrive = hhmm(start + durationMin);
  return {
    from,
    to,
    date,
    carrier,
    cabin,
    depart: depart.time,
    arrive: arrive.time,
    nextDay: arrive.dayShift > 0,
    durationMin,
    stops: via.length,
    via,
    award,
  };
}

export interface AwardPrice {
  programId: string;
  miles: number;
  taxes: number;
  offPeak: boolean;
  open: boolean;
  date: string;
}

export interface AwardQuote extends AwardPrice {
  slices: FlightSlice[];
}

const awardPriceCache = new Map<string, AwardPrice | null>();

export function awardPrice(
  programId: string,
  from: string,
  to: string,
  date: string,
  cabin: Cabin,
  allowDateShift: boolean,
): AwardPrice | null {
  const key = `${programId}|${from}|${to}|${date}|${cabin}|${allowDateShift ? 1 : 0}`;
  if (awardPriceCache.has(key)) return awardPriceCache.get(key) ?? null;
  const priced = computeAwardPrice(programId, from, to, date, cabin, allowDateShift);
  if (awardPriceCache.size > 4000) awardPriceCache.clear();
  awardPriceCache.set(key, priced);
  return priced;
}

function computeAwardPrice(
  programId: string,
  from: string,
  to: string,
  date: string,
  cabin: Cabin,
  allowDateShift: boolean,
): AwardPrice | null {
  const program = programById(programId);
  const chart = CHARTS[programId];
  if (!program || !chart || program.kind !== "airline") return null;
  const origin = requireAirport(from);
  const dest = requireAirport(to);
  const km = distanceKm(origin, dest);
  const band = chart.find((entry) => km <= entry.maxKm) ?? chart[chart.length - 1];
  let miles = band.eco;
  const offPeak = (programId === "iberia" || programId === "ba") && isOffPeak(date);
  if (offPeak) miles = Math.round((miles * 0.75) / 500) * 500;
  if (cabin === "premium") miles = Math.round((miles * 1.6) / 500) * 500;
  if (cabin === "business") miles = Math.round((miles * 2) / 500) * 500;
  const seatDate = allowDateShift ? firstOpenDate(programId, from, to, date, cabin) : date;
  const open = awardOpen(programId, from, to, seatDate, cabin);
  return { programId, miles, taxes: taxesFor(programId, km), offPeak, open, date: open ? seatDate : date };
}

export function awardQuote(
  programId: string,
  from: string,
  to: string,
  date: string,
  cabin: Cabin,
  allowDateShift: boolean,
): AwardQuote | null {
  const priced = awardPrice(programId, from, to, date, cabin, allowDateShift);
  if (!priced) return null;
  if (!priced.open) return { ...priced, slices: [] };
  const program = programById(programId);
  if (!program) return null;
  return { ...priced, slices: awardSlices(program, from, to, priced.date, cabin) };
}

function isOffPeak(date: string) {
  const month = monthOf(date);
  const dow = dowOf(date);
  return (month === 1 || month === 2 || month === 11) && (dow === 2 || dow === 3);
}

function awardOpen(programId: string, from: string, to: string, date: string, cabin: Cabin) {
  const h = unitHash(`${programId}|${from}|${to}|${date}|${cabin}`);
  const threshold = cabin === "business" ? 0.55 : cabin === "premium" ? 0.42 : 0.28;
  return h > threshold;
}

function firstOpenDate(programId: string, from: string, to: string, date: string, cabin: Cabin) {
  if (awardOpen(programId, from, to, date, cabin)) return date;
  for (const offset of [1, -1, 2, -2, 3, -3]) {
    const next = addDays(date, offset);
    if (awardOpen(programId, from, to, next, cabin)) return next;
  }
  return date;
}

function taxesFor(programId: string, km: number) {
  let taxes = km < 1500 ? 29 : km < 3500 ? 64 : km < 7500 ? 148 : 198;
  if (programId === "mnm") taxes += 42;
  if (programId === "ba") taxes += 28;
  if (programId === "qatar") taxes += 18;
  if (programId === "virgin") taxes += 36;
  return taxes;
}

function awardSlices(program: (typeof PROGRAMS)[number], from: string, to: string, date: string, cabin: Cabin) {
  const origin = requireAirport(from);
  const dest = requireAirport(to);
  const carrier = program.carrier;
  if (hasNonstop(origin, dest) || !program.hub || program.hub === from || program.hub === to) {
    return [buildSlice(from, to, date, cabin, carrier, true, `aw${program.id}${from}${to}${date}`)];
  }
  const hub = program.hub;
  const hubAirport = airportByCode(hub);
  if (!hubAirport) return [buildSlice(from, to, date, cabin, carrier, true, `aw${program.id}${from}${to}${date}`)];
  const viaKm = distanceKm(origin, hubAirport) + distanceKm(hubAirport, dest);
  if (viaKm / Math.max(1, distanceKm(origin, dest)) > 1.75) {
    return [buildSlice(from, to, date, cabin, carrier, true, `aw${program.id}${from}${to}${date}`, ["partner"])];
  }
  const first = buildSlice(from, hub, date, cabin, carrier, true, `aw1${program.id}${from}${hub}${date}`, [hub]);
  const start = toMinutes(first.depart) + first.durationMin + 95;
  const clock = hhmm(start);
  const secondDate = addDays(date, clock.dayShift);
  const duration = Math.max(50, Math.round(distanceKm(hubAirport, dest) / 13.5) + 28);
  const arrive = hhmm(start + duration);
  const second: FlightSlice = {
    from: hub,
    to,
    date: secondDate,
    carrier,
    cabin,
    depart: clock.time,
    arrive: arrive.time,
    nextDay: arrive.dayShift > clock.dayShift,
    durationMin: duration,
    stops: 0,
    via: [],
    award: true,
  };
  return [first, second];
}

function toMinutes(hhmmText: string) {
  const [h, m] = hhmmText.split(":").map(Number);
  return h * 60 + m;
}

export function groundCost(homeCode: string, altCode: string) {
  if (homeCode === altCode) return 0;
  const km = distanceKm(requireAirport(homeCode), requireAirport(altCode));
  return Math.round(km * 0.42 + 14);
}
