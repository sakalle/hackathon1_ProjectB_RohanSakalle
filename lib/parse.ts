import { AIRPORTS, airportByCode } from "./airports";
import { addDays, isIsoDate, todayISO } from "./dates";
import type { Cabin, ParsedTrip } from "./types";

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export function parseTripText(raw: string): ParsedTrip {
  const text = decode(raw).replace(/\s+/g, " ").trim();
  const notes: string[] = [];
  const url = fromUrl(text);
  const codes = url?.codes ?? iataCodes(text);
  const cities = cityCodes(text);
  const route = codes.length >= 2 ? codes : cities;
  const dates = url?.dates ?? findDates(text);
  const adults = numberBefore(text, ["adults", "adult", "pax", "passengers", "people"]) ?? 1;
  const children = numberBefore(text, ["children", "child", "kids", "kid"]) ?? 0;
  const cabin = cabinOf(text);
  const flexible = /flex/i.test(text);
  const nearby = /nearby|alternate airport|alternative airport/i.test(text);

  if (url?.source) notes.push(`Read as a ${url.source} link.`);
  if (!route.length) notes.push("No city or airport code found. Add something like MAD to JFK.");
  if (route.length === 1) notes.push("Only one place was found. Add a destination.");

  const mode = route.length > 2 ? "plan" : "quick";
  const legs =
    mode === "plan"
      ? pairLegs(route, dates)
      : route.length >= 2
        ? [
            { origin: route[0], destination: route[1], date: dates[0] ?? addDays(todayISO(), 30) },
            ...(dates[1] || /return|round/i.test(text)
              ? [{ origin: route[1], destination: route[0], date: dates[1] ?? addDays(dates[0] ?? todayISO(), 7) }]
              : []),
          ]
        : [];

  if (dates.length === 0 && route.length >= 2) notes.push("No date found. A date a month from today was used so you can edit it.");

  return {
    origin: route[0] ?? null,
    destination: route[1] ?? null,
    depart: legs[0]?.date ?? null,
    ret: mode === "quick" && legs[1] ? legs[1].date : null,
    legs,
    adults: clamp(adults, 1, 9),
    children: clamp(children, 0, 8),
    cabin,
    flexible,
    nearby,
    mode: legs.length > 2 || (mode === "plan" && legs.length >= 2) ? (legs.length >= 2 && !(legs.length === 2 && legs[0].origin === legs[1].destination) ? "plan" : "quick") : "quick",
    notes,
  };
}

function decode(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

function fromUrl(text: string): { codes: string[]; dates: string[]; source: string } | null {
  const sky = text.match(/flights\/([a-z]{3})\/([a-z]{3})\/(\d{6})(?:\/(\d{6}))?/i);
  if (sky && airportByCode(sky[1]) && airportByCode(sky[2])) {
    return {
      codes: [sky[1].toUpperCase(), sky[2].toUpperCase()],
      dates: [fromYyMmDd(sky[3]), sky[4] ? fromYyMmDd(sky[4]) : ""].filter(Boolean),
      source: "Skyscanner",
    };
  }
  const kayak = text.match(/flights\/([A-Za-z]{3})-([A-Za-z]{3})\/(\d{4}-\d{2}-\d{2})(?:\/(\d{4}-\d{2}-\d{2}))?/);
  if (kayak && airportByCode(kayak[1]) && airportByCode(kayak[2])) {
    return {
      codes: [kayak[1].toUpperCase(), kayak[2].toUpperCase()],
      dates: [kayak[3], kayak[4]].filter((date): date is string => Boolean(date && isIsoDate(date))),
      source: "Kayak",
    };
  }
  const google = text.match(/([A-Za-z]{3})\.([A-Za-z]{3})\.(\d{4}-\d{2}-\d{2})/);
  if (google && airportByCode(google[1]) && airportByCode(google[2])) {
    return {
      codes: [google[1].toUpperCase(), google[2].toUpperCase()],
      dates: [google[3]],
      source: "Google Flights",
    };
  }
  return null;
}

function fromYyMmDd(value: string) {
  const year = Number(value.slice(0, 2));
  const full = `${year > 70 ? "19" : "20"}${value.slice(0, 2)}-${value.slice(2, 4)}-${value.slice(4, 6)}`;
  return isIsoDate(full) ? full : "";
}

function iataCodes(text: string) {
  const found: string[] = [];
  for (const match of text.toUpperCase().matchAll(/\b([A-Z]{3})\b/g)) {
    if (airportByCode(match[1])) found.push(match[1]);
  }
  return dedupeKeepOrder(found);
}

function cityCodes(text: string) {
  const lower = text.toLowerCase();
  const hits: { index: number; code: string }[] = [];
  const cities = [...new Map(AIRPORTS.map((airport) => [airport.city.toLowerCase(), airport])).values()].sort(
    (a, b) => b.city.length - a.city.length,
  );
  for (const airport of cities) {
    const name = airport.city.toLowerCase();
    const index = lower.indexOf(name);
    if (index >= 0) hits.push({ index, code: airport.iata });
  }
  hits.sort((a, b) => a.index - b.index);
  return dedupeKeepOrder(hits.map((hit) => hit.code));
}

function findDates(text: string) {
  const dates: string[] = [];
  for (const match of text.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)) {
    const iso = `${match[1]}-${match[2]}-${match[3]}`;
    if (isIsoDate(iso)) dates.push(iso);
  }
  for (const match of text.matchAll(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})\b/g)) {
    const iso = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    if (isIsoDate(iso)) dates.push(iso);
  }
  for (const match of text.matchAll(/\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(20\d{2})\b/gi)) {
    const month = MONTHS[match[2].toLowerCase()];
    const iso = `${match[3]}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    if (isIsoDate(iso)) dates.push(iso);
  }
  for (const match of text.matchAll(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2}),?\s+(20\d{2})\b/gi)) {
    const month = MONTHS[match[1].toLowerCase()];
    const iso = `${match[3]}-${String(month).padStart(2, "0")}-${match[2].padStart(2, "0")}`;
    if (isIsoDate(iso)) dates.push(iso);
  }
  return dedupeKeepOrder(dates);
}

function pairLegs(codes: string[], dates: string[]) {
  const legs = [];
  for (let i = 0; i < codes.length - 1 && legs.length < 6; i++) {
    legs.push({
      origin: codes[i],
      destination: codes[i + 1],
      date: dates[i] ?? addDays(dates[i - 1] ?? todayISO(), 4),
    });
  }
  return legs;
}

function numberBefore(text: string, words: string[]) {
  for (const word of words) {
    const match = text.match(new RegExp(`(\\d+)\\s+${word}\\b`, "i"));
    if (match) return Number(match[1]);
  }
  return null;
}

function cabinOf(text: string): Cabin {
  if (/business|biz class/i.test(text)) return "business";
  if (/premium/i.test(text)) return "premium";
  return "economy";
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function dedupeKeepOrder(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}
