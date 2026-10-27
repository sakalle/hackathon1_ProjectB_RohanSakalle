export type ProgramKind = "airline" | "bank";

export interface Program {
  id: string;
  name: string;
  kind: ProgramKind;
  unit: string;
  carrier: string;
  hub?: string;
}

export const PROGRAMS: Program[] = [
  { id: "iberia", name: "Iberia Plus", kind: "airline", unit: "Avios", carrier: "Iberia", hub: "MAD" },
  { id: "ba", name: "British Airways Club", kind: "airline", unit: "Avios", carrier: "British Airways", hub: "LHR" },
  { id: "flyingblue", name: "Flying Blue", kind: "airline", unit: "miles", carrier: "Air France", hub: "CDG" },
  { id: "mnm", name: "Miles & More", kind: "airline", unit: "miles", carrier: "Lufthansa", hub: "FRA" },
  { id: "aeroplan", name: "Aeroplan", kind: "airline", unit: "points", carrier: "Air Canada", hub: "YYZ" },
  { id: "virgin", name: "Virgin Atlantic Flying Club", kind: "airline", unit: "points", carrier: "Virgin Atlantic", hub: "LHR" },
  { id: "aa", name: "AAdvantage", kind: "airline", unit: "miles", carrier: "American Airlines", hub: "MIA" },
  { id: "united", name: "MileagePlus", kind: "airline", unit: "miles", carrier: "United", hub: "EWR" },
  { id: "turkish", name: "Turkish Miles&Smiles", kind: "airline", unit: "miles", carrier: "Turkish Airlines", hub: "IST" },
  { id: "qatar", name: "Qatar Privilege Club", kind: "airline", unit: "Avios", carrier: "Qatar Airways", hub: "DOH" },
  { id: "amex", name: "Amex Membership Rewards", kind: "bank", unit: "points", carrier: "Amex" },
  { id: "chase", name: "Chase Ultimate Rewards", kind: "bank", unit: "points", carrier: "Chase" },
  { id: "citi", name: "Citi ThankYou", kind: "bank", unit: "points", carrier: "Citi" },
  { id: "capone", name: "Capital One Miles", kind: "bank", unit: "miles", carrier: "Capital One" },
];

export const TRANSFERS: Record<string, string[]> = {
  amex: ["iberia", "ba", "flyingblue", "virgin", "aeroplan"],
  chase: ["united", "virgin", "flyingblue", "iberia", "ba", "aeroplan"],
  citi: ["flyingblue", "virgin", "aa", "ba"],
  capone: ["flyingblue", "virgin", "ba", "turkish"],
};

export const SAMPLE_WALLET: Record<string, number> = {
  iberia: 45000,
  flyingblue: 22000,
  mnm: 15000,
  amex: 80000,
};

const BY_ID = new Map(PROGRAMS.map((program) => [program.id, program]));

export function programById(id: string) {
  return BY_ID.get(id) ?? null;
}

export function airlinePrograms() {
  return PROGRAMS.filter((program) => program.kind === "airline");
}

export function bankPrograms() {
  return PROGRAMS.filter((program) => program.kind === "bank");
}

export const PROGRAM_SITES: Record<string, string> = {
  iberia: "https://www.iberia.com/gb/iberiaplus/",
  ba: "https://www.britishairways.com/travel/redeem/execclub/_gf/en_gb",
  flyingblue: "https://wwws.airfrance.us/search/offers",
  mnm: "https://www.miles-and-more.com/row/en/award-flights.html",
  aeroplan: "https://www.aircanada.com/aeroplan",
  virgin: "https://www.virginatlantic.com/reward-flight-search",
  aa: "https://www.aa.com/loyalty/award-travel",
  united: "https://www.united.com/en/us/fly/mileageplus.html",
  turkish: "https://www.turkishairlines.com/en-int/miles-and-smiles/",
  qatar: "https://www.qatarairways.com/en/Privilege-Club.html",
};

export function airlineSearchUrl(programId: string, from: string, to: string, date: string) {
  const query = encodeURIComponent(`${from} to ${to} ${date}`);
  const google = `https://www.google.com/travel/flights?q=${query}`;
  return PROGRAM_SITES[programId] ?? google;
}

export function banksThatTransferTo(programId: string) {
  return Object.entries(TRANSFERS)
    .filter(([, partners]) => partners.includes(programId))
    .map(([bankId]) => programById(bankId)?.name ?? bankId);
}

export const FLAG_CARRIER: Record<string, string> = {
  Spain: "Iberia",
  Portugal: "TAP Air Portugal",
  France: "Air France",
  "United Kingdom": "British Airways",
  Ireland: "Aer Lingus",
  Netherlands: "KLM",
  Belgium: "Brussels Airlines",
  Germany: "Lufthansa",
  Switzerland: "SWISS",
  Italy: "ITA Airways",
  Austria: "Austrian",
  Denmark: "SAS",
  Sweden: "SAS",
  Norway: "SAS",
  Finland: "Finnair",
  Poland: "LOT",
  Czechia: "Czech Airlines",
  Hungary: "Lufthansa",
  Greece: "Aegean",
  Turkey: "Turkish Airlines",
  Qatar: "Qatar Airways",
  UAE: "Emirates",
  Egypt: "EgyptAir",
  Ethiopia: "Ethiopian",
  "South Africa": "South African",
  Morocco: "Royal Air Maroc",
  Senegal: "Air Senegal",
  "United States": "American Airlines",
  Mexico: "Aeroméxico",
  Panama: "Copa",
  Colombia: "Avianca",
  Peru: "LATAM",
  Ecuador: "LATAM",
  Brazil: "LATAM",
  Argentina: "Aerolíneas Argentinas",
  Chile: "LATAM",
  Canada: "Air Canada",
  Japan: "Japan Airlines",
  "South Korea": "Korean Air",
  Singapore: "Singapore Airlines",
  Thailand: "Thai Airways",
  "Hong Kong": "Cathay Pacific",
  India: "Air India",
};

export const SWEET_HUBS = ["LIS", "IST", "HEL", "DOH", "MAD", "AMS", "CDG", "FRA", "DXB", "ADD"] as const;

export const HUB_CARRIER: Record<string, string> = {
  LIS: "TAP Air Portugal",
  IST: "Turkish Airlines",
  HEL: "Finnair",
  DOH: "Qatar Airways",
  MAD: "Iberia",
  AMS: "KLM",
  CDG: "Air France",
  FRA: "Lufthansa",
  DXB: "Emirates",
  ADD: "Ethiopian",
  LHR: "British Airways",
  JFK: "American Airlines",
  MIA: "American Airlines",
  EWR: "United",
  YYZ: "Air Canada",
};
