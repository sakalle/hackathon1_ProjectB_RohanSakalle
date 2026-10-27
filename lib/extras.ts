import { AIRPORTS, requireAirport } from "./airports";
import { addDays } from "./dates";
import { awardPrice, segmentFare } from "./pricing";
import { TRANSFERS, airlinePrograms, airlineSearchUrl, banksThatTransferTo, programById } from "./programs";
import type { AwardDay, Cabin, ProgramQuote, SearchLegInput } from "./types";

export function programBoard(legs: SearchLegInput[], cabin: Cabin, cashPerAdult: number): ProgramQuote[] {
  const first = legs[0];
  return airlinePrograms()
    .map((program) => {
      let miles = 0;
      let taxes = 0;
      let open = true;
      for (const leg of legs) {
        const quote = awardPrice(program.id, leg.origin, leg.destination, leg.date, cabin, true);
        if (!quote || !quote.open) {
          open = false;
          miles += quote?.miles ?? 0;
          taxes += quote?.taxes ?? 0;
          continue;
        }
        miles += quote.miles;
        taxes += quote.taxes;
      }
      const cpp = miles > 0 ? ((cashPerAdult - taxes) / miles) * 100 : null;
      return {
        programId: program.id,
        programName: program.name,
        carrier: program.carrier,
        unit: program.unit,
        miles,
        taxes,
        open,
        cpp: cpp == null ? null : Math.round(cpp * 10) / 10,
        searchUrl: airlineSearchUrl(program.id, first.origin, first.destination, first.date),
        transferableFrom: banksThatTransferTo(program.id),
      };
    })
    .sort((a, b) => Number(b.open) - Number(a.open) || a.miles - b.miles);
}

export function awardMonth(legs: SearchLegInput[], cabin: Cabin, today: string): AwardDay[] {
  const first = legs[0];
  const start = `${first.date.slice(0, 7)}-01`;
  const days: AwardDay[] = [];
  for (let offset = 0; offset < 31; offset++) {
    const date = addDays(start, offset);
    if (date.slice(0, 7) !== start.slice(0, 7)) break;
    if (date < today) continue;
    const cash = segmentFare(first.origin, first.destination, date, cabin, today);
    let best: { miles: number; taxes: number; programId: string; programName: string } | null = null;
    for (const program of airlinePrograms()) {
      const quote = awardPrice(program.id, first.origin, first.destination, date, cabin, false);
      if (!quote || !quote.open) continue;
      if (!best || quote.miles < best.miles) best = { miles: quote.miles, taxes: quote.taxes, programId: program.id, programName: program.name };
    }
    days.push({
      date,
      cash,
      miles: best?.miles ?? null,
      programId: best?.programId ?? null,
      programName: best?.programName ?? null,
      taxes: best?.taxes ?? null,
      open: Boolean(best),
    });
  }
  return days;
}

export interface ExploreHit {
  origin: string;
  destination: string;
  city: string;
  country: string;
  programId: string;
  programName: string;
  unit: string;
  miles: number;
  taxes: number;
  cpp: number;
  transferFrom: string | null;
}

export function exploreFromWallet(origin: string, cabin: Cabin, balances: Record<string, number>, date: string): ExploreHit[] {
  const home = requireAirport(origin);
  const dests = [...new Map(AIRPORTS.filter((airport) => airport.tier === 1 && airport.metro !== home.metro).map((airport) => [airport.metro, airport])).values()];
  const hits: ExploreHit[] = [];
  for (const dest of dests) {
    let best: ExploreHit | null = null;
    for (const program of airlinePrograms()) {
      const quote = awardPrice(program.id, home.iata, dest.iata, date, cabin, true);
      if (!quote || !quote.open) continue;
      const have = (balances[program.id] ?? 0) + transferable(program.id, balances);
      if (have < quote.miles) continue;
      const cash = segmentFare(home.iata, dest.iata, date, cabin, date);
      const cpp = ((cash - quote.taxes) / quote.miles) * 100;
      if (cpp < 0.8) continue;
      const transferFrom = (balances[program.id] ?? 0) >= quote.miles ? null : firstBank(program.id, balances);
      const hit: ExploreHit = {
        origin: home.iata,
        destination: dest.iata,
        city: dest.city,
        country: dest.country,
        programId: program.id,
        programName: program.name,
        unit: program.unit,
        miles: quote.miles,
        taxes: quote.taxes,
        cpp: Math.round(cpp * 10) / 10,
        transferFrom,
      };
      if (!best || hit.cpp > best.cpp) best = hit;
    }
    if (best) hits.push(best);
  }
  return hits.sort((a, b) => b.cpp - a.cpp).slice(0, 10);
}

function transferable(programId: string, balances: Record<string, number>) {
  let total = 0;
  for (const [bankId, partners] of Object.entries(TRANSFERS)) {
    if (partners.includes(programId)) total += balances[bankId] ?? 0;
  }
  return total;
}

function firstBank(programId: string, balances: Record<string, number>) {
  for (const [bankId, partners] of Object.entries(TRANSFERS)) {
    if (partners.includes(programId) && (balances[bankId] ?? 0) > 0) return programById(bankId)?.name ?? bankId;
  }
  return null;
}
