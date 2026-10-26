import type { Airport } from "./types";

export const AIRPORTS: Airport[] = [
  { iata: "MAD", city: "Madrid", name: "Barajas", country: "Spain", lat: 40.498, lon: -3.568, metro: "mad", tier: 1 },
  { iata: "BCN", city: "Barcelona", name: "El Prat", country: "Spain", lat: 41.297, lon: 2.079, metro: "bcn", tier: 1 },
  { iata: "GRO", city: "Girona", name: "Girona", country: "Spain", lat: 41.901, lon: 2.761, metro: "bcn", tier: 3 },
  { iata: "REU", city: "Reus", name: "Reus", country: "Spain", lat: 41.147, lon: 1.167, metro: "bcn", tier: 3 },
  { iata: "AGP", city: "Málaga", name: "Málaga", country: "Spain", lat: 36.675, lon: -4.499, metro: "agp", tier: 2 },
  { iata: "VLC", city: "Valencia", name: "Manises", country: "Spain", lat: 39.489, lon: -0.482, metro: "vlc", tier: 2 },
  { iata: "SVQ", city: "Seville", name: "San Pablo", country: "Spain", lat: 37.418, lon: -5.893, metro: "svq", tier: 2 },
  { iata: "BIO", city: "Bilbao", name: "Loiu", country: "Spain", lat: 43.301, lon: -2.911, metro: "bio", tier: 2 },
  { iata: "PMI", city: "Palma", name: "Palma de Mallorca", country: "Spain", lat: 39.552, lon: 2.739, metro: "pmi", tier: 2 },
  { iata: "IBZ", city: "Ibiza", name: "Ibiza", country: "Spain", lat: 38.873, lon: 1.373, metro: "ibz", tier: 2 },
  { iata: "ALC", city: "Alicante", name: "Alicante", country: "Spain", lat: 38.282, lon: -0.558, metro: "alc", tier: 2 },
  { iata: "SCQ", city: "Santiago de Compostela", name: "Lavacolla", country: "Spain", lat: 42.896, lon: -8.415, metro: "scq", tier: 3 },
  { iata: "TFS", city: "Tenerife", name: "Tenerife South", country: "Spain", lat: 28.045, lon: -16.573, metro: "tfs", tier: 2 },
  { iata: "LPA", city: "Gran Canaria", name: "Las Palmas", country: "Spain", lat: 27.932, lon: -15.387, metro: "lpa", tier: 2 },
  { iata: "LIS", city: "Lisbon", name: "Humberto Delgado", country: "Portugal", lat: 38.781, lon: -9.136, metro: "lis", tier: 1 },
  { iata: "OPO", city: "Porto", name: "Francisco Sá Carneiro", country: "Portugal", lat: 41.248, lon: -8.681, metro: "opo", tier: 2 },
  { iata: "FAO", city: "Faro", name: "Faro", country: "Portugal", lat: 37.014, lon: -7.966, metro: "fao", tier: 2 },
  { iata: "CDG", city: "Paris", name: "Charles de Gaulle", country: "France", lat: 49.01, lon: 2.548, metro: "par", tier: 1 },
  { iata: "ORY", city: "Paris", name: "Orly", country: "France", lat: 48.726, lon: 2.365, metro: "par", tier: 2 },
  { iata: "NCE", city: "Nice", name: "Côte d'Azur", country: "France", lat: 43.658, lon: 7.216, metro: "nce", tier: 2 },
  { iata: "LYS", city: "Lyon", name: "Saint-Exupéry", country: "France", lat: 45.726, lon: 5.081, metro: "lys", tier: 2 },
  { iata: "LHR", city: "London", name: "Heathrow", country: "United Kingdom", lat: 51.47, lon: -0.454, metro: "lon", tier: 1 },
  { iata: "LGW", city: "London", name: "Gatwick", country: "United Kingdom", lat: 51.154, lon: -0.182, metro: "lon", tier: 2 },
  { iata: "STN", city: "London", name: "Stansted", country: "United Kingdom", lat: 51.885, lon: 0.235, metro: "lon", tier: 3 },
  { iata: "LTN", city: "London", name: "Luton", country: "United Kingdom", lat: 51.875, lon: -0.368, metro: "lon", tier: 3 },
  { iata: "LCY", city: "London", name: "City", country: "United Kingdom", lat: 51.505, lon: 0.055, metro: "lon", tier: 3 },
  { iata: "MAN", city: "Manchester", name: "Manchester", country: "United Kingdom", lat: 53.354, lon: -2.275, metro: "man", tier: 2 },
  { iata: "EDI", city: "Edinburgh", name: "Edinburgh", country: "United Kingdom", lat: 55.95, lon: -3.373, metro: "edi", tier: 2 },
  { iata: "DUB", city: "Dublin", name: "Dublin", country: "Ireland", lat: 53.421, lon: -6.27, metro: "dub", tier: 1 },
  { iata: "AMS", city: "Amsterdam", name: "Schiphol", country: "Netherlands", lat: 52.311, lon: 4.768, metro: "ams", tier: 1 },
  { iata: "BRU", city: "Brussels", name: "Brussels", country: "Belgium", lat: 50.901, lon: 4.484, metro: "bru", tier: 1 },
  { iata: "FRA", city: "Frankfurt", name: "Frankfurt", country: "Germany", lat: 50.038, lon: 8.562, metro: "fra", tier: 1 },
  { iata: "MUC", city: "Munich", name: "Munich", country: "Germany", lat: 48.354, lon: 11.786, metro: "muc", tier: 1 },
  { iata: "BER", city: "Berlin", name: "Brandenburg", country: "Germany", lat: 52.367, lon: 13.503, metro: "ber", tier: 1 },
  { iata: "ZRH", city: "Zurich", name: "Zurich", country: "Switzerland", lat: 47.458, lon: 8.556, metro: "zrh", tier: 1 },
  { iata: "GVA", city: "Geneva", name: "Geneva", country: "Switzerland", lat: 46.238, lon: 6.109, metro: "gva", tier: 2 },
  { iata: "FCO", city: "Rome", name: "Fiumicino", country: "Italy", lat: 41.8, lon: 12.239, metro: "rom", tier: 1 },
  { iata: "CIA", city: "Rome", name: "Ciampino", country: "Italy", lat: 41.799, lon: 12.595, metro: "rom", tier: 3 },
  { iata: "MXP", city: "Milan", name: "Malpensa", country: "Italy", lat: 45.631, lon: 8.723, metro: "mil", tier: 1 },
  { iata: "LIN", city: "Milan", name: "Linate", country: "Italy", lat: 45.445, lon: 9.277, metro: "mil", tier: 3 },
  { iata: "BGY", city: "Milan", name: "Bergamo", country: "Italy", lat: 45.674, lon: 9.704, metro: "mil", tier: 2 },
  { iata: "VCE", city: "Venice", name: "Marco Polo", country: "Italy", lat: 45.505, lon: 12.352, metro: "vce", tier: 2 },
  { iata: "NAP", city: "Naples", name: "Naples", country: "Italy", lat: 40.886, lon: 14.291, metro: "nap", tier: 2 },
  { iata: "VIE", city: "Vienna", name: "Vienna", country: "Austria", lat: 48.11, lon: 16.57, metro: "vie", tier: 1 },
  { iata: "CPH", city: "Copenhagen", name: "Kastrup", country: "Denmark", lat: 55.618, lon: 12.651, metro: "cph", tier: 1 },
  { iata: "ARN", city: "Stockholm", name: "Arlanda", country: "Sweden", lat: 59.652, lon: 17.919, metro: "sto", tier: 1 },
  { iata: "BMA", city: "Stockholm", name: "Bromma", country: "Sweden", lat: 59.354, lon: 17.942, metro: "sto", tier: 3 },
  { iata: "OSL", city: "Oslo", name: "Gardermoen", country: "Norway", lat: 60.194, lon: 11.1, metro: "osl", tier: 1 },
  { iata: "HEL", city: "Helsinki", name: "Helsinki", country: "Finland", lat: 60.317, lon: 24.963, metro: "hel", tier: 1 },
  { iata: "WAW", city: "Warsaw", name: "Chopin", country: "Poland", lat: 52.166, lon: 20.967, metro: "waw", tier: 1 },
  { iata: "KRK", city: "Kraków", name: "Kraków", country: "Poland", lat: 50.078, lon: 19.785, metro: "krk", tier: 2 },
  { iata: "PRG", city: "Prague", name: "Václav Havel", country: "Czechia", lat: 50.101, lon: 14.26, metro: "prg", tier: 1 },
  { iata: "BUD", city: "Budapest", name: "Budapest", country: "Hungary", lat: 47.43, lon: 19.261, metro: "bud", tier: 1 },
  { iata: "ATH", city: "Athens", name: "Eleftherios Venizelos", country: "Greece", lat: 37.936, lon: 23.944, metro: "ath", tier: 1 },
  { iata: "IST", city: "Istanbul", name: "Istanbul", country: "Turkey", lat: 41.275, lon: 28.752, metro: "ist", tier: 1 },
  { iata: "DOH", city: "Doha", name: "Hamad", country: "Qatar", lat: 25.273, lon: 51.608, metro: "doh", tier: 1 },
  { iata: "DXB", city: "Dubai", name: "Dubai", country: "UAE", lat: 25.253, lon: 55.366, metro: "dxb", tier: 1 },
  { iata: "AUH", city: "Abu Dhabi", name: "Zayed", country: "UAE", lat: 24.433, lon: 54.651, metro: "auh", tier: 1 },
  { iata: "CAI", city: "Cairo", name: "Cairo", country: "Egypt", lat: 30.122, lon: 31.406, metro: "cai", tier: 1 },
  { iata: "ADD", city: "Addis Ababa", name: "Bole", country: "Ethiopia", lat: 8.978, lon: 38.799, metro: "add", tier: 1 },
  { iata: "JNB", city: "Johannesburg", name: "O. R. Tambo", country: "South Africa", lat: -26.139, lon: 28.246, metro: "jnb", tier: 1 },
  { iata: "RAK", city: "Marrakesh", name: "Marrakesh", country: "Morocco", lat: 31.607, lon: -8.037, metro: "rak", tier: 2 },
  { iata: "CMN", city: "Casablanca", name: "Mohammed V", country: "Morocco", lat: 33.368, lon: -7.59, metro: "cmn", tier: 1 },
  { iata: "DSS", city: "Dakar", name: "Blaise Diagne", country: "Senegal", lat: 14.74, lon: -17.49, metro: "dss", tier: 2 },
  { iata: "JFK", city: "New York", name: "John F. Kennedy", country: "United States", lat: 40.641, lon: -73.778, metro: "nyc", tier: 1 },
  { iata: "EWR", city: "New York", name: "Newark", country: "United States", lat: 40.69, lon: -74.175, metro: "nyc", tier: 1 },
  { iata: "LGA", city: "New York", name: "LaGuardia", country: "United States", lat: 40.777, lon: -73.874, metro: "nyc", tier: 2 },
  { iata: "BOS", city: "Boston", name: "Logan", country: "United States", lat: 42.366, lon: -71.01, metro: "bos", tier: 1 },
  { iata: "IAD", city: "Washington", name: "Dulles", country: "United States", lat: 38.953, lon: -77.457, metro: "was", tier: 1 },
  { iata: "DCA", city: "Washington", name: "Reagan", country: "United States", lat: 38.851, lon: -77.04, metro: "was", tier: 2 },
  { iata: "MIA", city: "Miami", name: "Miami", country: "United States", lat: 25.796, lon: -80.287, metro: "mia", tier: 1 },
  { iata: "MCO", city: "Orlando", name: "Orlando", country: "United States", lat: 28.431, lon: -81.308, metro: "mco", tier: 1 },
  { iata: "ORD", city: "Chicago", name: "O'Hare", country: "United States", lat: 41.974, lon: -87.907, metro: "chi", tier: 1 },
  { iata: "MDW", city: "Chicago", name: "Midway", country: "United States", lat: 41.787, lon: -87.752, metro: "chi", tier: 2 },
  { iata: "LAX", city: "Los Angeles", name: "Los Angeles", country: "United States", lat: 33.942, lon: -118.409, metro: "lax", tier: 1 },
  { iata: "SFO", city: "San Francisco", name: "San Francisco", country: "United States", lat: 37.621, lon: -122.379, metro: "sfo", tier: 1 },
  { iata: "SEA", city: "Seattle", name: "Sea-Tac", country: "United States", lat: 47.45, lon: -122.309, metro: "sea", tier: 1 },
  { iata: "IAH", city: "Houston", name: "George Bush", country: "United States", lat: 29.99, lon: -95.337, metro: "iah", tier: 1 },
  { iata: "MEX", city: "Mexico City", name: "Benito Juárez", country: "Mexico", lat: 19.436, lon: -99.072, metro: "mex", tier: 1 },
  { iata: "CUN", city: "Cancún", name: "Cancún", country: "Mexico", lat: 21.037, lon: -86.877, metro: "cun", tier: 1 },
  { iata: "PTY", city: "Panama City", name: "Tocumen", country: "Panama", lat: 9.071, lon: -79.384, metro: "pty", tier: 1 },
  { iata: "BOG", city: "Bogotá", name: "El Dorado", country: "Colombia", lat: 4.702, lon: -74.147, metro: "bog", tier: 1 },
  { iata: "LIM", city: "Lima", name: "Jorge Chávez", country: "Peru", lat: -12.022, lon: -77.114, metro: "lim", tier: 1 },
  { iata: "UIO", city: "Quito", name: "Mariscal Sucre", country: "Ecuador", lat: -0.129, lon: -78.358, metro: "uio", tier: 2 },
  { iata: "GRU", city: "São Paulo", name: "Guarulhos", country: "Brazil", lat: -23.436, lon: -46.473, metro: "sao", tier: 1 },
  { iata: "CGH", city: "São Paulo", name: "Congonhas", country: "Brazil", lat: -23.626, lon: -46.657, metro: "sao", tier: 2 },
  { iata: "GIG", city: "Rio de Janeiro", name: "Galeão", country: "Brazil", lat: -22.81, lon: -43.251, metro: "rio", tier: 1 },
  { iata: "SDU", city: "Rio de Janeiro", name: "Santos Dumont", country: "Brazil", lat: -22.911, lon: -43.163, metro: "rio", tier: 2 },
  { iata: "EZE", city: "Buenos Aires", name: "Ezeiza", country: "Argentina", lat: -34.822, lon: -58.536, metro: "bue", tier: 1 },
  { iata: "AEP", city: "Buenos Aires", name: "Aeroparque", country: "Argentina", lat: -34.559, lon: -58.416, metro: "bue", tier: 2 },
  { iata: "SCL", city: "Santiago", name: "Arturo Merino Benítez", country: "Chile", lat: -33.393, lon: -70.786, metro: "scl", tier: 1 },
  { iata: "YYZ", city: "Toronto", name: "Pearson", country: "Canada", lat: 43.678, lon: -79.625, metro: "yyz", tier: 1 },
  { iata: "YUL", city: "Montreal", name: "Trudeau", country: "Canada", lat: 45.471, lon: -73.741, metro: "yul", tier: 1 },
  { iata: "NRT", city: "Tokyo", name: "Narita", country: "Japan", lat: 35.772, lon: 140.393, metro: "tyo", tier: 1 },
  { iata: "HND", city: "Tokyo", name: "Haneda", country: "Japan", lat: 35.549, lon: 139.78, metro: "tyo", tier: 1 },
  { iata: "ICN", city: "Seoul", name: "Incheon", country: "South Korea", lat: 37.46, lon: 126.441, metro: "sel", tier: 1 },
  { iata: "SIN", city: "Singapore", name: "Changi", country: "Singapore", lat: 1.364, lon: 103.992, metro: "sin", tier: 1 },
  { iata: "BKK", city: "Bangkok", name: "Suvarnabhumi", country: "Thailand", lat: 13.69, lon: 100.75, metro: "bkk", tier: 1 },
  { iata: "HKG", city: "Hong Kong", name: "Hong Kong", country: "Hong Kong", lat: 22.308, lon: 113.919, metro: "hkg", tier: 1 },
  { iata: "DEL", city: "Delhi", name: "Indira Gandhi", country: "India", lat: 28.556, lon: 77.1, metro: "del", tier: 1 },
];

const BY_IATA = new Map(AIRPORTS.map((airport) => [airport.iata, airport]));

export function airportByCode(code: string) {
  return BY_IATA.get(code.trim().toUpperCase()) ?? null;
}

export function requireAirport(code: string) {
  const airport = airportByCode(code);
  if (!airport) throw new Error(`Unknown airport ${code.toUpperCase()}. Use a city or a three-letter code.`);
  return airport;
}

export function searchAirports(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return AIRPORTS.slice(0, 8);
  return AIRPORTS.filter((airport) => {
    const blob = `${airport.iata} ${airport.city} ${airport.name} ${airport.country}`.toLowerCase();
    return blob.includes(q);
  })
    .sort((a, b) => {
      const aStart = a.iata.toLowerCase().startsWith(q) || a.city.toLowerCase().startsWith(q) ? 0 : 1;
      const bStart = b.iata.toLowerCase().startsWith(q) || b.city.toLowerCase().startsWith(q) ? 0 : 1;
      return aStart - bStart || a.tier - b.tier || a.city.localeCompare(b.city);
    })
    .slice(0, 8);
}

export function distanceKm(a: Airport, b: Airport) {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function hasNonstop(a: Airport, b: Airport) {
  if (a.metro === b.metro) return false;
  const km = distanceKm(a, b);
  if (km < 450) return a.tier <= 2 && b.tier <= 2;
  if (km < 2200) return a.tier <= 2 && b.tier <= 2 && (a.tier === 1 || b.tier === 1);
  if (km < 9800) return a.tier === 1 && b.tier === 1;
  return false;
}

export function nearbyAirports(origin: Airport) {
  return AIRPORTS.filter((candidate) => {
    if (candidate.iata === origin.iata) return false;
    if (candidate.metro === origin.metro) return true;
    return distanceKm(origin, candidate) <= 165;
  })
    .sort((a, b) => distanceKm(origin, a) - distanceKm(origin, b))
    .slice(0, 3);
}

export function cityLabel(code: string) {
  return airportByCode(code)?.city ?? code;
}

export function placeLabel(code: string) {
  const airport = airportByCode(code);
  if (!airport) return code;
  return `${airport.city} (${airport.iata})`;
}
