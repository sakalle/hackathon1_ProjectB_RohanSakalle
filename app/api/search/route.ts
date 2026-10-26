import { NextResponse } from "next/server";
import { isIsoDate, todayISO } from "@/lib/dates";
import { balancesMap, saveSearch } from "@/lib/db";
import { buildTrip } from "@/lib/engine";
import type { Cabin, SearchInput, SearchLegInput, TripMode } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = normalize(body);
    const built = buildTrip(input, balancesMap(), todayISO());
    const id = saveSearch(input, built);
    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not search.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function normalize(body: unknown): SearchInput {
  const raw = body as Record<string, unknown>;
  const mode: TripMode = raw.mode === "plan" ? "plan" : "quick";
  const cabin = raw.cabin === "premium" || raw.cabin === "business" ? raw.cabin : "economy";
  const legs = Array.isArray(raw.legs) ? raw.legs.map(normalizeLeg) : [];
  if (!legs.length) throw new Error("Add at least one flight.");
  return {
    mode,
    tripName: typeof raw.tripName === "string" ? raw.tripName.slice(0, 80) : undefined,
    legs,
    adults: clamp(raw.adults, 1, 9, 1),
    children: clamp(raw.children, 0, 8, 0),
    cabin: cabin as Cabin,
    flexible: Boolean(raw.flexible),
    nearby: Boolean(raw.nearby),
  };
}

function normalizeLeg(value: unknown): SearchLegInput {
  const leg = value as Record<string, unknown>;
  const origin = String(leg.origin ?? "").toUpperCase();
  const destination = String(leg.destination ?? "").toUpperCase();
  const date = String(leg.date ?? "");
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) throw new Error("Use airport codes from the list.");
  if (!isIsoDate(date)) throw new Error("Each flight needs a valid date.");
  return { origin, destination, date };
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}
