export function todayISO() {
  const dt = new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

export function monthOf(iso: string) {
  return Number(iso.slice(5, 7));
}

export function dowOf(iso: string) {
  return new Date(Date.parse(`${iso}T00:00:00Z`)).getUTCDay();
}

export function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function unitHash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export function hhmm(totalMinutes: number) {
  const dayShift = Math.floor(totalMinutes / 1440);
  const mins = ((totalMinutes % 1440) + 1440) % 1440;
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  return {
    time: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    dayShift,
  };
}
