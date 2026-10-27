import { cityLabel, distanceKm, nearbyAirports, placeLabel, requireAirport } from "./airports";
import { addDays } from "./dates";
import { prettyDate } from "./format";
import {
  awardQuote,
  groundCost,
  publishedLeg,
  splitLeg,
  sweetLeg,
  type PricedLeg,
} from "./pricing";
import { awardMonth, programBoard } from "./extras";
import { PROGRAM_SITES, TRANSFERS, programById } from "./programs";
import type {
  BuiltSearch,
  Cabin,
  FareDay,
  FlightSlice,
  GuideStep,
  Offer,
  PointsUse,
  SearchInput,
  SearchLegInput,
  Airport,
} from "./types";

interface Pool {
  [programId: string]: number;
}

interface AwardUse {
  programId: string;
  milesEach: number;
  taxesEach: number;
  slices: FlightSlice[];
  date: string;
  transfer?: { bankId: string; amount: number };
  offPeak: boolean;
}

export function buildTrip(input: SearchInput, balances: Record<string, number>, today: string): BuiltSearch {
  const legs = input.legs.map((leg) => ({
    origin: leg.origin.toUpperCase(),
    destination: leg.destination.toUpperCase(),
    date: leg.date,
  }));
  validate(legs, input, today);
  const seats = input.adults + input.children;
  const cashSeats = input.adults + input.children * 0.75;
  const roundTrip = isRoundTrip(legs);
  const baseline = legs.map((leg) => publishedLeg(leg.origin, leg.destination, leg.date, input.cabin, today));
  const normalPrice = totalCash(baseline.map((leg) => leg.price), cashSeats, roundTrip);

  const offers: Offer[] = [];
  const seen = new Set<string>();

  const push = (offer: Offer | null) => {
    if (!offer) return;
    if (offer.savingsEur < 12 && !offer.locked) return;
    const key = `${offer.strategy}|${offer.hackedPrice}|${offer.slices.map((slice) => slice.from + slice.to + slice.date).join(",")}|${offer.points.map((p) => p.amount).join(",")}`;
    if (seen.has(key)) return;
    seen.add(key);
    offers.push(offer);
  };

  if (input.flexible) {
    const flexed = flexLegs(legs, input.cabin, today, roundTrip);
    if (flexed) {
      push(
        cashOffer({
          id: "flexible",
          strategy: "flexible_dates",
          eyebrow: "Flexible dates",
          title: flexed.changed
            ? `Cheaper on ${prettyShift(legs, flexed.legs)}`
            : "A cheaper day is already your date",
          summary: "Same cities. The fare moves a lot across a single week, so the search checks three days either side.",
          why: flexed.why,
          legs: flexed.priced,
          tags: ["Flexible dates"],
          normalPrice,
          cashSeats,
          roundTrip: roundTrip && isRoundTrip(flexed.legs),
          seats,
        }),
      );
    }
  }

  if (input.nearby) {
    const near = nearbyCombo(legs, input.cabin, today, roundTrip, false);
    if (near) {
      push(
        cashOffer({
          id: "nearby",
          strategy: "nearby_airport",
          eyebrow: "Nearby airport",
          title: near.title,
          summary: "A different airport in the same trip, after the cost of getting there.",
          why: near.why,
          legs: near.priced,
          tags: ["Nearby airport"],
          normalPrice,
          cashSeats,
          roundTrip,
          seats,
          extraCash: near.ground,
        }),
      );
    }
  }

  if (input.flexible && input.nearby) {
    const both = nearbyCombo(legs, input.cabin, today, roundTrip, true);
    if (both) {
      push(
        cashOffer({
          id: "both",
          strategy: "flex_nearby",
          eyebrow: "Dates and airports",
          title: both.title,
          summary: "The two easiest cash hacks stacked: a better day and a better airport.",
          why: both.why,
          legs: both.priced,
          tags: ["Flexible dates", "Nearby airport"],
          normalPrice,
          cashSeats,
          roundTrip,
          seats,
          extraCash: both.ground,
        }),
      );
    }
  }

  const sweet = applyPerLeg(legs, input.cabin, today, (leg) => sweetLeg(leg.origin, leg.destination, leg.date, input.cabin, today));
  if (sweet) {
    const via = unique(sweet.flatMap((leg) => leg.via));
    push(
      cashOffer({
        id: "sweet",
        strategy: "smarter_route",
        eyebrow: "Smarter route",
        title: via.length ? `Connect through ${via.map(cityLabel).join(" and ")}` : "A cheaper routing",
        summary: "Most people buy the obvious flight. A known connecting hub is often priced lower.",
        why: [
          via.length
            ? `The routing uses ${via.map((code) => placeLabel(code)).join(" and ")} because that path is priced below the straightforward fare.`
            : "A connecting fare beats the nonstop.",
          via.some((code) => code === "LIS" || code === "IST" || code === "DOH")
            ? "On TAP, Turkish and Qatar, this kind of ticket is a usual place people stop for a night or two on the way. Build a long connection only if the airline sells it as one ticket."
            : "This is one ticket with a connection, so a delay is the airline's problem to fix.",
          "Milla only keeps this route when the saving is large enough to be worth the extra time.",
        ],
        legs: sweet,
        tags: ["Smarter route"],
        normalPrice,
        cashSeats,
        roundTrip,
        seats,
      }),
    );
  }

  const split = applyPerLeg(legs, input.cabin, today, (leg) => splitLeg(leg.origin, leg.destination, leg.date, input.cabin, today));
  if (split) {
    push(
      cashOffer({
        id: "split",
        strategy: "split_ticket",
        eyebrow: "Two tickets",
        title: "Buy the sectors separately",
        summary: "Two cheap tickets can beat one through fare. You carry the risk of the connection.",
        why: [
          "Each sector is its own ticket. The price is lower because no single airline is selling the whole trip.",
          "Leave at least three hours between them. If the first flight is late, the second airline does not have to rebook you.",
          "This is worth it when the gap in price is wide, and a bad idea when you would miss a cruise, a wedding, or the last flight of the day.",
        ],
        legs: split,
        tags: ["Self-connect"],
        normalPrice,
        cashSeats,
        roundTrip: false,
        seats,
      }),
    );
  }

  const awardOffers = awardOffersFor(legs, input, balances, normalPrice, cashSeats, seats, today, roundTrip);
  awardOffers.forEach(push);

  const positioning = positioningOffer(legs, input, balances, normalPrice, cashSeats, seats, today);
  push(positioning);

  const missed = missedAward(legs, input, balances, normalPrice, cashSeats, seats, today, roundTrip);
  if (missed) offers.push(missed);

  const usable = offers.filter((offer) => !offer.locked && !offer.weak);
  usable.sort((a, b) => b.savingsEur - a.savingsEur);
  const weak = offers.filter((offer) => offer.weak && !offer.locked).sort((a, b) => b.savingsEur - a.savingsEur);
  const locked = offers.filter((offer) => offer.locked);
  const ordered = [...usable, ...weak, ...locked].slice(0, 8);
  if (ordered[0] && !ordered[0].locked && !ordered[0].weak) ordered[0].recommended = true;

  const best = ordered.find((offer) => offer.recommended) ?? null;
  const bestPrice = best ? best.hackedPrice : normalPrice;
  const savingsEur = Math.max(0, normalPrice - bestPrice);
  const calendar = buildCalendar(legs, input.cabin, today, roundTrip, cashSeats);

  const notes: string[] = [];
  if (input.children > 0) {
    notes.push("Cash fares count each child at 75% of an adult. Award seats charge full miles for every seat, including children.");
  }
  if (!roundTrip && legs.length >= 2 && legs[0].origin !== legs[legs.length - 1].destination) {
    notes.push("This is an open jaw: you arrive in one city and leave from another, so you do not pay to double back.");
  }
  if (!best) {
    notes.push("The normal fare is already sharp. Dates, nearby airports and routes do not beat it by enough to matter.");
  }
  notes.push("Fares and award prices come from Milla's model, built from distance, season, and public sweet-spot charts. The saving is explained on every option.");

  const cashPerAdult = Math.round(normalPrice / Math.max(1, cashSeats));
  return {
    title: input.tripName?.trim() || titleFor(legs),
    normalPrice,
    bestPrice,
    savingsEur,
    savingsPct: normalPrice ? (savingsEur / normalPrice) * 100 : 0,
    offers: ordered,
    calendar,
    awardMonth: awardMonth(legs, input.cabin, today),
    programBoard: programBoard(legs, input.cabin, cashPerAdult),
    notes,
  };
}

function validate(legs: SearchLegInput[], input: SearchInput, today: string) {
  if (!legs.length || legs.length > 6) throw new Error("Use between one and six flights.");
  if (input.adults < 1 || input.adults > 9) throw new Error("Add at least one adult.");
  if (input.children < 0 || input.children > 8) throw new Error("Children must be between 0 and 8.");
  if (!["economy", "premium", "business"].includes(input.cabin)) throw new Error("Choose a cabin.");
  for (const leg of legs) {
    const from = requireAirport(leg.origin);
    const to = requireAirport(leg.destination);
    if (from.iata === to.iata || from.metro === to.metro) {
      throw new Error(`${from.city} and ${to.city} are the same place. Pick another destination.`);
    }
    if (leg.date < today) throw new Error("Choose dates from today onward.");
  }
}

function titleFor(legs: SearchLegInput[]) {
  if (isRoundTrip(legs)) return `${cityLabel(legs[0].origin)} to ${cityLabel(legs[0].destination)}`;
  const cities = [cityLabel(legs[0].origin), ...legs.map((leg) => cityLabel(leg.destination))];
  return cities.join(" → ");
}

function isRoundTrip(legs: SearchLegInput[]) {
  return legs.length === 2 && legs[0].origin === legs[1].destination && legs[0].destination === legs[1].origin;
}

function totalCash(prices: number[], cashSeats: number, roundTrip: boolean) {
  const sum = prices.reduce((total, price) => total + price, 0);
  const discounted = roundTrip ? sum * 0.93 : sum;
  return Math.round(discounted * cashSeats);
}

function flexLegs(legs: SearchLegInput[], cabin: Cabin, today: string, roundTrip: boolean) {
  if (roundTrip) {
    let best: { legs: SearchLegInput[]; priced: PricedLeg[]; price: number } | null = null;
    for (let d = -3; d <= 3; d++) {
      for (let r = -3; r <= 3; r++) {
        const depart = addDays(legs[0].date, d);
        const ret = addDays(legs[1].date, r);
        if (depart < today || ret <= depart) continue;
        const next = [
          { origin: legs[0].origin, destination: legs[0].destination, date: depart },
          { origin: legs[1].origin, destination: legs[1].destination, date: ret },
        ];
        const priced = next.map((leg) => publishedLeg(leg.origin, leg.destination, leg.date, cabin, today));
        const price = totalCash(priced.map((leg) => leg.price), 1, true);
        if (!best || price < best.price) best = { legs: next, priced, price };
      }
    }
    if (!best) return null;
    const original = totalCash(
      legs.map((leg) => publishedLeg(leg.origin, leg.destination, leg.date, cabin, today).price),
      1,
      true,
    );
    if (best.price >= original - 8) return null;
    return {
      legs: best.legs,
      priced: best.priced,
      changed: best.legs.some((leg, index) => leg.date !== legs[index].date),
      why: [
        `Tuesday and Wednesday departures are priced lower than Friday and Sunday on this route.`,
        `The cheaper pair is ${best.legs[0].date} out and ${best.legs[1].date} back. Your original dates were ${legs[0].date} and ${legs[1].date}.`,
        "The cities stay the same, so this is the first hack to check before spending miles.",
      ],
    };
  }

  const next: SearchLegInput[] = [];
  const priced: PricedLeg[] = [];
  let previous = today;
  let changed = false;
  for (const leg of legs) {
    let bestDate = leg.date;
    let bestPrice = publishedLeg(leg.origin, leg.destination, leg.date, cabin, today).price;
    for (let offset = -3; offset <= 3; offset++) {
      const date = addDays(leg.date, offset);
      if (date < previous) continue;
      const price = publishedLeg(leg.origin, leg.destination, date, cabin, today).price;
      if (price < bestPrice) {
        bestPrice = price;
        bestDate = date;
      }
    }
    if (bestDate !== leg.date) changed = true;
    const chosen = { ...leg, date: bestDate };
    next.push(chosen);
    priced.push(publishedLeg(chosen.origin, chosen.destination, chosen.date, cabin, today));
    previous = bestDate;
  }
  const before = legs.reduce((sum, leg) => sum + publishedLeg(leg.origin, leg.destination, leg.date, cabin, today).price, 0);
  const after = priced.reduce((sum, leg) => sum + leg.price, 0);
  if (after >= before - 8) return null;
  return {
    legs: next,
    priced,
    changed,
    why: [
      "Each flight was checked three days earlier and later, keeping the rest of the plan in order.",
      next.map((leg, index) => `${cityLabel(leg.origin)} → ${cityLabel(leg.destination)} on ${leg.date}${leg.date !== legs[index].date ? ` instead of ${legs[index].date}` : ""}`).join(". ") + ".",
      "Moving a date is free money when the trip can flex. Miles are worth saving for a fare that does not move.",
    ],
  };
}

function nearbyCombo(legs: SearchLegInput[], cabin: Cabin, today: string, roundTrip: boolean, flex: boolean) {
  const choices = legs.map((leg) => ({
    origins: [leg.origin, ...nearbyAirports(requireAirport(leg.origin)).map((airport) => airport.iata)],
    dests: [leg.destination, ...nearbyAirports(requireAirport(leg.destination)).map((airport) => airport.iata)],
    dates: flex ? [-3, -2, -1, 0, 1, 2, 3].map((offset) => addDays(leg.date, offset)).filter((date) => date >= today) : [leg.date],
  }));

  const picked: {
    value: { priced: PricedLeg[]; ground: number; price: number; why: string[]; title: string } | null;
  } = { value: null };
  const limited = choices.map((choice) => ({
    origins: choice.origins.slice(0, 3),
    dests: choice.dests.slice(0, 3),
    dates: choice.dates,
  }));

  if (roundTrip && limited.length === 2) {
    limited[1].origins = [legs[1].origin];
    limited[1].dests = [legs[1].destination];
  }

  if (legs.length > 2) {
    let previous = today;
    for (let index = 0; index < legs.length; index++) {
      const choice = limited[index];
      let winner: { from: string; to: string; date: string; price: number } | null = null;
      for (const from of choice.origins) {
        for (const to of choice.dests) {
          const fromAirport = requireAirport(from);
        const toAirport = requireAirport(to);
        if (fromAirport.metro === toAirport.metro) continue;
        if (!longHaulOk(fromAirport, toAirport)) continue;
          for (const date of choice.dates) {
            if (date < previous) continue;
            const quote = publishedLeg(from, to, date, cabin, today);
            const extra = groundCost(legs[index].origin, from) + groundCost(legs[index].destination, to);
            const price = quote.price + extra;
            if (!winner || price < winner.price) winner = { from, to, date, price };
          }
        }
      }
      if (!winner) return null;
      limited[index] = { origins: [winner.from], dests: [winner.to], dates: [winner.date] };
      previous = winner.date;
    }
  }

  const walk = (index: number, acc: { from: string; to: string; date: string }[]) => {
    if (index === legs.length) {
      if (roundTrip && acc.length === 2) {
        acc[1] = { from: acc[0].to, to: acc[0].from, date: acc[1].date };
        if (acc[1].date <= acc[0].date) return;
      }
      for (let i = 1; i < acc.length; i++) {
        if (acc[i].date < acc[i - 1].date) return;
      }
      const priced = acc.map((leg) => publishedLeg(leg.from, leg.to, leg.date, cabin, today));
      let ground = 0;
      const why: string[] = [];
      acc.forEach((leg, legIndex) => {
        if (roundTrip && legIndex > 0) {
          if (leg.date !== legs[legIndex].date) why.push(`The return moves to ${leg.date}.`);
          return;
        }
        const times = roundTrip ? 2 : 1;
        if (leg.from !== legs[legIndex].origin) {
          const once = groundCost(legs[legIndex].origin, leg.from);
          ground += once * times;
          why.push(
            `${placeLabel(leg.from)} replaces ${placeLabel(legs[legIndex].origin)}. Getting there is about €${once} a person each way, and that cost is already taken off the saving.`,
          );
        }
        if (leg.to !== legs[legIndex].destination) {
          const once = groundCost(legs[legIndex].destination, leg.to);
          ground += once * times;
          why.push(
            `${placeLabel(leg.to)} replaces ${placeLabel(legs[legIndex].destination)}. The ground cost is included, so a far airport cannot pretend to be a bargain.`,
          );
        }
        if (leg.date !== legs[legIndex].date) {
          why.push(`${cityLabel(leg.from)} → ${cityLabel(leg.to)} moves to ${leg.date}.`);
        }
      });
      const price = totalCash(priced.map((leg) => leg.price), 1, roundTrip && isRoundTrip(acc.map((leg) => ({ origin: leg.from, destination: leg.to, date: leg.date })))) + ground;
      const original = totalCash(legs.map((leg) => publishedLeg(leg.origin, leg.destination, leg.date, cabin, today).price), 1, roundTrip);
      if (price >= original - 12) return;
      const moved = acc.filter((leg, legIndex) => leg.from !== legs[legIndex].origin || leg.to !== legs[legIndex].destination);
      if (!moved.length) return;
      const title = moved.length
        ? moved.map((leg) => `${cityLabel(leg.from)} (${leg.from}) → ${cityLabel(leg.to)} (${leg.to})`).join(", ")
        : "A nearby airport";
      if (!picked.value || price < picked.value.price) picked.value = { priced, ground, price, why, title };
      return;
    }
    const choice = limited[index];
    for (const from of choice.origins) {
      for (const to of choice.dests) {
        const fromAirport = requireAirport(from);
        const toAirport = requireAirport(to);
        if (fromAirport.metro === toAirport.metro) continue;
        if (!longHaulOk(fromAirport, toAirport)) continue;
        for (const date of choice.dates) {
          walk(index + 1, [...acc, { from, to, date }]);
        }
      }
    }
  };
  walk(0, []);
  if (!picked.value) return null;
  if (!picked.value.why.length) picked.value.why.push("A nearby airport beats the one you typed, even after the ride to get there.");
  picked.value.why.push("Milla subtracts a ground cost of about €0.42 per kilometre plus a fixed €14, so the saving is what you would actually keep.");
  return picked.value;
}

function applyPerLeg(
  legs: SearchLegInput[],
  cabin: Cabin,
  today: string,
  hack: (leg: SearchLegInput) => PricedLeg | null,
) {
  const priced = legs.map((leg) => hack(leg) ?? publishedLeg(leg.origin, leg.destination, leg.date, cabin, today));
  if (!priced.some((leg) => leg.kind === "sweet" || leg.kind === "split")) return null;
  return priced;
}

function cashOffer(args: {
  id: string;
  strategy: string;
  eyebrow: string;
  title: string;
  summary: string;
  why: string[];
  legs: PricedLeg[];
  tags: string[];
  normalPrice: number;
  cashSeats: number;
  roundTrip: boolean;
  seats: number;
  extraCash?: number;
}): Offer | null {
  const people = args.cashSeats;
  const fare = Math.round(args.legs.reduce((sum, leg) => sum + leg.price, 0) * (args.roundTrip ? 0.93 : 1) * people);
  const hacked = fare + Math.round((args.extraCash ?? 0) * args.seats);
  const savings = args.normalPrice - hacked;
  if (savings < 12) return null;
  return {
    id: args.id,
    strategy: args.strategy,
    eyebrow: args.eyebrow,
    title: args.title,
    summary: args.summary,
    why: args.why,
    slices: args.legs.flatMap((leg) => leg.slices),
    cashOutOfPocket: hacked,
    points: [],
    normalPrice: args.normalPrice,
    hackedPrice: hacked,
    savingsEur: savings,
    savingsPct: (savings / args.normalPrice) * 100,
    centsPerPoint: null,
    bookPath: "cash",
    guide: cashGuide(args.title, hacked),
    tags: args.tags,
    recommended: false,
    locked: false,
    weak: false,
  };
}

function awardOffersFor(
  legs: SearchLegInput[],
  input: SearchInput,
  balances: Record<string, number>,
  normalPrice: number,
  cashSeats: number,
  seats: number,
  today: string,
  roundTrip: boolean,
) {
  const funded = fundAwards(legs, input.cabin, balances, seats, true);
  if (!funded.length) return [];
  return funded.map((plan, index) =>
    awardToOffer(plan, legs, input.cabin, normalPrice, cashSeats, seats, today, roundTrip, index),
  ).filter((offer): offer is Offer => Boolean(offer));
}

interface FundedPlan {
  uses: (AwardUse | null)[];
  points: PointsUse[];
  note: string;
}

function fundAwards(
  legs: SearchLegInput[],
  cabin: Cabin,
  balances: Record<string, number>,
  seats: number,
  dateShift: boolean,
): FundedPlan[] {
  const plans: FundedPlan[] = [];
  const direct = greedy(legs, cabin, { ...balances }, seats, dateShift, false);
  if (direct.uses.some(Boolean)) plans.push(direct);
  const transferred = greedy(legs, cabin, { ...balances }, seats, dateShift, true);
  if (transferred.uses.some((use) => use?.transfer)) plans.push(transferred);
  return plans;
}

function greedy(
  legs: SearchLegInput[],
  cabin: Cabin,
  start: Pool,
  seats: number,
  dateShift: boolean,
  allowTransfer: boolean,
): FundedPlan {
  const pool: Pool = { ...start };
  const order = legs.map((leg, index) => ({ leg, index })).sort((a, b) => {
    return publishedGuess(b.leg, cabin) - publishedGuess(a.leg, cabin);
  });
  const uses: (AwardUse | null)[] = legs.map(() => null);
  for (const item of order) {
    const best = bestSource(item.leg, cabin, pool, seats, dateShift, allowTransfer);
    if (!best) continue;
    const value = best.cashEach - best.taxesEach;
    const cpp = (value / best.milesEach) * 100;
    if (cpp < 0.8) continue;
    uses[item.index] = {
      programId: best.programId,
      milesEach: best.milesEach,
      taxesEach: best.taxesEach,
      slices: best.slices,
      date: best.date,
      offPeak: best.offPeak,
      transfer: best.transfer,
    };
    if (best.transfer) pool[best.transfer.bankId] = (pool[best.transfer.bankId] ?? 0) - best.milesEach * seats;
    else pool[best.programId] = (pool[best.programId] ?? 0) - best.milesEach * seats;
  }
  const points = mergePoints(uses, seats);
  const via = points.some((point) => point.source === "transfer");
  return {
    uses,
    points,
    note: via ? "transfer" : "wallet",
  };
}

function publishedGuess(leg: SearchLegInput, cabin: Cabin) {
  return publishedLeg(leg.origin, leg.destination, leg.date, cabin, leg.date).price;
}

interface AwardChoice {
  programId: string;
  milesEach: number;
  taxesEach: number;
  slices: FlightSlice[];
  date: string;
  offPeak: boolean;
  cpp: number;
  cashEach: number;
  transfer?: { bankId: string; amount: number };
}

function bestSource(
  leg: SearchLegInput,
  cabin: Cabin,
  pool: Pool,
  seats: number,
  dateShift: boolean,
  allowTransfer: boolean,
): AwardChoice | null {
  const cashEach = publishedLeg(leg.origin, leg.destination, leg.date, cabin, leg.date).price;
  const choice: { value: AwardChoice | null } = { value: null };

  const consider = (programId: string, available: number, transfer?: { bankId: string }) => {
    if (available <= 0) return;
    const quote = awardQuote(programId, leg.origin, leg.destination, leg.date, cabin, dateShift);
    if (!quote || !quote.open) return;
    const need = quote.miles * seats;
    if (need > available) return;
    const cpp = ((cashEach - quote.taxes) / quote.miles) * 100;
    if (!choice.value || cpp > choice.value.cpp) {
      choice.value = {
        programId,
        milesEach: quote.miles,
        taxesEach: quote.taxes,
        slices: quote.slices,
        date: quote.date,
        offPeak: quote.offPeak,
        cpp,
        cashEach,
        transfer: transfer ? { bankId: transfer.bankId, amount: quote.miles * seats } : undefined,
      };
    }
  };

  for (const [programId, balance] of Object.entries(pool)) {
    const program = programById(programId);
    if (!program || program.kind !== "airline") continue;
    consider(programId, balance);
  }
  if (allowTransfer) {
    for (const [bankId, partners] of Object.entries(TRANSFERS)) {
      const bankBalance = pool[bankId] ?? 0;
      if (!bankBalance) continue;
      for (const partner of partners) {
        consider(partner, bankBalance, { bankId });
      }
    }
  }
  return choice.value;
}

function mergePoints(uses: (AwardUse | null)[], seats: number): PointsUse[] {
  const map = new Map<string, PointsUse>();
  for (const use of uses) {
    if (!use) continue;
    const program = programById(use.programId);
    if (!program) continue;
    const key = use.transfer ? `${use.transfer.bankId}>${use.programId}` : use.programId;
    const amount = use.milesEach * seats;
    const existing = map.get(key);
    if (existing) {
      existing.amount += amount;
      if (existing.fromAmount) existing.fromAmount += amount;
    } else if (use.transfer) {
      const bank = programById(use.transfer.bankId);
      map.set(key, {
        programId: use.programId,
        programName: program.name,
        unit: program.unit,
        amount,
        source: "transfer",
        fromProgramId: use.transfer.bankId,
        fromProgramName: bank?.name ?? use.transfer.bankId,
        fromAmount: amount,
      });
    } else {
      map.set(key, {
        programId: use.programId,
        programName: program.name,
        unit: program.unit,
        amount,
        source: "wallet",
      });
    }
  }
  return [...map.values()];
}

function awardToOffer(
  plan: FundedPlan,
  legs: SearchLegInput[],
  cabin: Cabin,
  normalPrice: number,
  cashSeats: number,
  seats: number,
  today: string,
  roundTrip: boolean,
  index: number,
): Offer | null {
  const slices: FlightSlice[] = [];
  let pointsValue = 0;
  let pointsSpent = 0;
  const why: string[] = [];
  const cashLegs: PricedLeg[] = [];
  plan.uses.forEach((use, legIndex) => {
    const leg = legs[legIndex];
    if (!use) {
      const priced = publishedLeg(leg.origin, leg.destination, leg.date, cabin, today);
      cashLegs.push(priced);
      slices.push(...priced.slices);
      return;
    }
    const program = programById(use.programId)!;
    slices.push(...use.slices);
    const published = publishedLeg(leg.origin, leg.destination, leg.date, cabin, today).price;
    pointsValue += (published - use.taxesEach) * seats;
    pointsSpent += use.milesEach * seats;
    const dateNote = use.date !== leg.date ? ` The seat is open on ${use.date}, not ${leg.date}.` : "";
    const peak = use.offPeak ? " Off-peak Avios pricing applies on this midweek winter date." : "";
    if (use.transfer) {
      const bank = programById(use.transfer.bankId);
      why.push(
        `${placeLabel(leg.origin)} to ${placeLabel(leg.destination)} is booked with ${use.milesEach.toLocaleString("en-GB")} ${program.unit} per person, transferred 1:1 from ${bank?.name ?? "your points"}. Taxes are about €${use.taxesEach} a seat.${dateNote}${peak}`,
      );
    } else {
      why.push(
        `${placeLabel(leg.origin)} to ${placeLabel(leg.destination)} is an award on ${program.name}: ${use.milesEach.toLocaleString("en-GB")} ${program.unit} and about €${use.taxesEach} in taxes, per person.${dateNote}${peak}`,
      );
    }
  });
  const cashLegTotal = cashLegs.length
    ? Math.round(
        cashLegs.reduce((sum, leg) => sum + leg.price, 0) *
          (inputRound(cashLegs, legs, roundTrip) ? 0.93 : 1) *
          cashSeats,
      )
    : 0;
  const taxesOnly = plan.uses.reduce((sum, use) => sum + (use ? use.taxesEach * seats : 0), 0);
  const hacked = taxesOnly + cashLegTotal;
  const savings = normalPrice - hacked;
  if (savings < 12 || pointsSpent <= 0) return null;
  const cpp = (pointsValue / pointsSpent) * 100;
  const transfer = plan.points.some((point) => point.source === "transfer");
  const weak = cpp < 0.8;
  const names = [...new Set(plan.points.map((point) => point.programName))].join(" and ");
  return {
    id: transfer ? `transfer-${index}` : `award-${index}`,
    strategy: transfer ? "transfer" : "award",
    eyebrow: transfer ? "Points transfer" : "Miles you already have",
    title: transfer ? `Move points into ${names}` : `Spend ${names}`,
    summary: transfer
      ? "Bank points become airline miles at 1:1, then the seat is booked with the airline."
      : "The miles already in your wallet pay for the seat. You pay the taxes.",
    why: [
      ...why,
      `That is ${cpp.toFixed(1)} cents of fare per point. Milla skips redemptions under 0.8 cents, because those points are worth more on another trip.`,
      cashLegTotal > 0
        ? "Miles go on the flights where they buy the most cash. The other flights stay as paid tickets."
        : "Every flight in this plan is an award, so the cash you pay is tax, not fare.",
    ],
    slices,
    cashOutOfPocket: hacked,
    points: plan.points,
    normalPrice,
    hackedPrice: hacked,
    savingsEur: savings,
    savingsPct: (savings / normalPrice) * 100,
    centsPerPoint: Math.round(cpp * 10) / 10,
    bookPath: cashLegTotal > 0 ? "mixed" : "award",
    guide: awardGuide(plan, legs),
    tags: transfer ? ["Transfer partner", cpp >= 1.2 ? "Good value" : "Fair value"] : ["Award", cpp >= 1.2 ? "Good value" : "Fair value"],
    recommended: false,
    locked: false,
    weak,
  };
}

function inputRound(cashLegs: PricedLeg[], legs: SearchLegInput[], roundTrip: boolean) {
  return roundTrip && cashLegs.length === 2 && legs.length === 2;
}

function positioningOffer(
  legs: SearchLegInput[],
  input: SearchInput,
  balances: Record<string, number>,
  normalPrice: number,
  cashSeats: number,
  seats: number,
  today: string,
): Offer | null {
  const longIndex = legs.findIndex((leg) => {
    const from = requireAirport(leg.origin);
    const to = requireAirport(leg.destination);
    const km = Math.abs(from.lat - to.lat) + Math.abs(from.lon - to.lon);
    return km > 25;
  });
  if (longIndex < 0) return null;
  const leg = legs[longIndex];
  const origin = requireAirport(leg.origin);
  const dest = requireAirport(leg.destination);
  if (origin.tier === 1 && dest.tier === 1) return null;
  const gateways = ["MAD", "LIS", "LHR", "CDG", "AMS", "FRA", "IST", "DOH", "JFK", "MIA", "EWR"]
    .map((code) => requireAirport(code))
    .filter((gateway) => {
      if (gateway.iata === origin.iata || gateway.iata === dest.iata) return false;
      if (gateway.metro === origin.metro || gateway.metro === dest.metro) return false;
      const hop = distanceKm(origin, gateway);
      const via = hop + distanceKm(gateway, dest);
      const direct = distanceKm(origin, dest);
      return hop >= 180 && hop <= 1600 && via / direct < 1.35 && direct > 2500;
    });
  if (!gateways.length) return null;

  let best: Offer | null = null;
  for (const gateway of gateways) {
    const fakeLeg: SearchLegInput = { origin: gateway.iata, destination: dest.iata, date: leg.date };
    const funded = fundAwards([fakeLeg], input.cabin, balances, seats, input.flexible || true);
    const plan = funded.find((item) => item.uses[0]);
    if (!plan || !plan.uses[0]) continue;
    const hop = publishedLeg(origin.iata, gateway.iata, leg.date, "economy", today);
    const use = plan.uses[0];
    const slices = [...hop.slices, ...use.slices];
    const cash = Math.round(hop.price * cashSeats) + use.taxesEach * seats;
    let otherCash = 0;
    const otherSlices: FlightSlice[] = [];
    legs.forEach((other, index) => {
      if (index === longIndex) return;
      const priced = publishedLeg(other.origin, other.destination, other.date, input.cabin, today);
      otherCash += Math.round(priced.price * cashSeats);
      otherSlices.push(...priced.slices);
    });
    const hacked = cash + otherCash;
    const savings = normalPrice - hacked;
    if (savings < 20) continue;
    const program = programById(use.programId)!;
    const cpp = ((publishedLeg(gateway.iata, dest.iata, leg.date, input.cabin, today).price - use.taxesEach) / use.milesEach) * 100;
    if (cpp < 0.8) continue;
    const offer: Offer = {
      id: `position-${gateway.iata}`,
      strategy: "positioning",
      eyebrow: "Positioning flight",
      title: `Fly to ${gateway.city}, then use miles`,
      summary: `${origin.city} is not the best place to spend miles. A short cash flight gets you to ${gateway.city}, where the award is stronger.`,
      why: [
        `The short flight ${origin.iata} → ${gateway.iata} is a normal cash ticket, about €${hop.price} per adult.`,
        `${gateway.city} to ${dest.city} uses ${use.milesEach.toLocaleString("en-GB")} ${program.unit} on ${program.name}, plus about €${use.taxesEach} tax per person.`,
        "This is the move behind the name: get yourself to the right airport, then take the trip you actually wanted.",
        "Book the award first. Buy the short flight only after the miles seat is confirmed, with a gap of at least three hours.",
      ],
      slices: [...slices, ...otherSlices],
      cashOutOfPocket: hacked,
      points: plan.points,
      normalPrice,
      hackedPrice: hacked,
      savingsEur: savings,
      savingsPct: (savings / normalPrice) * 100,
      centsPerPoint: Math.round(cpp * 10) / 10,
      bookPath: "mixed",
      guide: positioningGuide(origin.city, gateway.city, dest.city, program.name, use, hop.price),
      tags: ["Positioning", "Award"],
      recommended: false,
      locked: false,
      weak: false,
    };
    if (!best || offer.savingsEur > best.savingsEur) best = offer;
  }
  return best;
}

function missedAward(
  legs: SearchLegInput[],
  input: SearchInput,
  balances: Record<string, number>,
  normalPrice: number,
  cashSeats: number,
  seats: number,
  today: string,
  roundTrip: boolean,
) {
  const infinite: Record<string, number> = {};
  for (const id of Object.keys(balances)) infinite[id] = balances[id] ?? 0;
  for (const program of ["iberia", "ba", "flyingblue", "mnm", "aeroplan", "virgin", "aa", "united", "turkish", "qatar"]) {
    infinite[program] = Math.max(infinite[program] ?? 0, 500000);
  }
  const plan = greedy(legs, input.cabin, infinite, seats, true, false);
  if (!plan.uses.some(Boolean)) return null;
  const offer = awardToOffer(plan, legs, input.cabin, normalPrice, cashSeats, seats, today, roundTrip, 9);
  if (!offer) return null;
  const needed = plan.uses.find(Boolean);
  if (!needed) return null;
  const have = (balances[needed.programId] ?? 0) + transferable(needed.programId, balances);
  const need = needed.milesEach * seats;
  if (have >= need) return null;
  if (offer.savingsEur < 40) return null;
  const program = programById(needed.programId)!;
  return {
    ...offer,
    id: "missed-award",
    strategy: "missed",
    eyebrow: "If you had the points",
    title: `${need.toLocaleString("en-GB")} ${program.unit} would change this trip`,
    summary: "This is the award Milla would book if the miles were already there. It is not counted in your saving yet.",
    locked: true,
    recommended: false,
    weak: false,
    savingsEur: offer.savingsEur,
    shortfall: {
      programId: program.id,
      programName: program.name,
      unit: program.unit,
      need,
      have,
    },
    why: [
      ...offer.why,
      `You can reach ${have.toLocaleString("en-GB")} ${program.unit} from your wallet and transfer partners. You are ${(need - have).toLocaleString("en-GB")} short.`,
    ],
    tags: ["Needs more points"],
  } satisfies Offer;
}

function transferable(programId: string, balances: Record<string, number>) {
  let total = 0;
  for (const [bankId, partners] of Object.entries(TRANSFERS)) {
    if (partners.includes(programId)) total += balances[bankId] ?? 0;
  }
  return total;
}

function buildCalendar(legs: SearchLegInput[], cabin: Cabin, today: string, roundTrip: boolean, cashSeats: number): FareDay[] {
  const days: FareDay[] = [];
  for (let offset = -3; offset <= 3; offset++) {
    const shifted = legs.map((leg) => ({ ...leg, date: addDays(leg.date, offset) }));
    if (shifted.some((leg) => leg.date < today)) continue;
    if (roundTrip && shifted[1].date <= shifted[0].date) continue;
    const priced = shifted.map((leg) => publishedLeg(leg.origin, leg.destination, leg.date, cabin, today));
    days.push({
      date: shifted[0].date,
      returnDate: shifted[1]?.date ?? null,
      price: totalCash(priced.map((leg) => leg.price), cashSeats, roundTrip),
      lowest: false,
    });
  }
  const min = Math.min(...days.map((day) => day.price));
  days.forEach((day) => {
    day.lowest = day.price === min;
  });
  return days;
}

function cashGuide(title: string, total: number): GuideStep[] {
  return [
    { title: "Check the flights", detail: `${title}. Confirm the cities, dates and cabin still match the trip you want.` },
    { title: "Enter the travellers", detail: "Names need to match the passport. A mismatch is the usual reason a ticket cannot be used." },
    { title: "Confirm in Milla", detail: `The cash fare is ${total} euros for the party. This demo records the booking and does not charge a card.` },
    { title: "Keep the reference", detail: "You get a Milla reference. On a live airline, this is the moment you would receive the ticket number." },
  ];
}

function awardGuide(plan: FundedPlan, legs: SearchLegInput[]): GuideStep[] {
  const steps: GuideStep[] = [];
  const transfers = plan.points.filter((point) => point.source === "transfer");
  if (transfers.length) {
    for (const point of transfers) {
      steps.push({
        title: `Transfer ${point.fromAmount?.toLocaleString("en-GB")} points`,
        detail: `In ${point.fromProgramName}, move ${point.fromAmount?.toLocaleString("en-GB")} ${point.unit} to ${point.programName}. The ratio is 1:1. Do it before you look for the seat. Transfers are not reversible.`,
      });
    }
  }
  plan.uses.forEach((use, index) => {
    if (!use) return;
    const program = programById(use.programId)!;
    const leg = legs[index];
    steps.push({
      title: `Search ${program.carrier} for ${leg.origin} → ${leg.destination}`,
      detail: `Log in to ${program.name}. Search ${use.date}, ${use.slices[0]?.cabin ?? "economy"}. You want a seat at ${use.milesEach.toLocaleString("en-GB")} ${program.unit} plus about €${use.taxesEach} tax per person. If the tax is much higher, stop.`,
      href: PROGRAM_SITES[program.id],
    });
  });
  if (plan.uses.some((use) => !use)) {
    steps.push({
      title: "Buy the remaining flights with cash",
      detail: "Book the paid flights only after the award seats are confirmed. Leave a gap of at least three hours if you are changing tickets.",
    });
  }
  steps.push({
    title: "Record it in Milla",
    detail: "When the airline confirms the ticket, mark it booked. The saving counts in your total.",
  });
  return steps;
}

function positioningGuide(
  origin: string,
  gateway: string,
  dest: string,
  programName: string,
  use: AwardUse,
  hopPrice: number,
): GuideStep[] {
  return [
    {
      title: `Book the ${gateway} → ${dest} award first`,
      detail: `Search ${programName} on ${use.date}. Hold or buy the seat at ${use.milesEach.toLocaleString("en-GB")} miles plus about €${use.taxesEach} tax before you buy anything else.`,
    },
    {
      title: `Then buy ${origin} → ${gateway}`,
      detail: `The short flight is about €${hopPrice} per adult. Same day is fine if you have three hours between landing and the long flight.`,
    },
    {
      title: "Do not reverse the order",
      detail: "If you buy the short cash flight first and the award disappears, you are stuck with a ticket to the wrong city.",
    },
    {
      title: "Mark the trip booked",
      detail: "Record it here so the saving joins the total on your trips page.",
    },
  ];
}

function longHaulOk(from: Airport, to: Airport) {
  return distanceKm(from, to) <= 1800 || (from.tier === 1 && to.tier === 1);
}

function prettyShift(original: SearchLegInput[], next: SearchLegInput[]) {
  return next
    .map((leg, index) => (leg.date === original[index].date ? null : prettyDate(leg.date)))
    .filter(Boolean)
    .join(" and ");
}

function unique(values: string[]) {
  return [...new Set(values)];
}
