export type Cabin = "economy" | "premium" | "business";
export type TripMode = "quick" | "plan";
export type BookPath = "cash" | "award" | "mixed";

export interface Airport {
  iata: string;
  city: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  metro: string;
  tier: 1 | 2 | 3;
}

export interface SearchLegInput {
  origin: string;
  destination: string;
  date: string;
}

export interface SearchInput {
  mode: TripMode;
  tripName?: string;
  legs: SearchLegInput[];
  adults: number;
  children: number;
  cabin: Cabin;
  flexible: boolean;
  nearby: boolean;
}

export interface FlightSlice {
  from: string;
  to: string;
  date: string;
  carrier: string;
  cabin: Cabin;
  depart: string;
  arrive: string;
  nextDay: boolean;
  durationMin: number;
  stops: number;
  via: string[];
  award: boolean;
}

export interface PointsUse {
  programId: string;
  programName: string;
  unit: string;
  amount: number;
  source: "wallet" | "transfer";
  fromProgramId?: string;
  fromProgramName?: string;
  fromAmount?: number;
}

export interface GuideStep {
  title: string;
  detail: string;
  href?: string;
}

export interface Offer {
  id: string;
  strategy: string;
  eyebrow: string;
  title: string;
  summary: string;
  why: string[];
  slices: FlightSlice[];
  cashOutOfPocket: number;
  points: PointsUse[];
  normalPrice: number;
  hackedPrice: number;
  savingsEur: number;
  savingsPct: number;
  centsPerPoint: number | null;
  bookPath: BookPath;
  guide: GuideStep[];
  tags: string[];
  recommended: boolean;
  locked: boolean;
  weak: boolean;
  live?: {
    offerId: string;
    passengerIds: string[];
    currency: string;
    amount: string;
    owner: string;
    documentsRequired: boolean;
  };
  shortfall?: {
    programId: string;
    programName: string;
    unit: string;
    need: number;
    have: number;
  };
}

export interface FareDay {
  date: string;
  returnDate: string | null;
  price: number;
  lowest: boolean;
}

export interface AwardDay {
  date: string;
  cash: number;
  miles: number | null;
  programId: string | null;
  programName: string | null;
  taxes: number | null;
  open: boolean;
}

export interface ProgramQuote {
  programId: string;
  programName: string;
  carrier: string;
  unit: string;
  miles: number;
  taxes: number;
  open: boolean;
  cpp: number | null;
  searchUrl: string;
  transferableFrom: string[];
}

export interface BuiltSearch {
  title: string;
  normalPrice: number;
  bestPrice: number;
  savingsEur: number;
  savingsPct: number;
  offers: Offer[];
  calendar: FareDay[];
  awardMonth: AwardDay[];
  programBoard: ProgramQuote[];
  notes: string[];
}

export interface ParsedTrip {
  origin: string | null;
  destination: string | null;
  depart: string | null;
  ret: string | null;
  legs: SearchLegInput[];
  adults: number;
  children: number;
  cabin: Cabin;
  flexible: boolean;
  nearby: boolean;
  mode: TripMode;
  notes: string[];
}
