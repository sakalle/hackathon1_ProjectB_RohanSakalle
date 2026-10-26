import type { Cabin } from "./types";

export function eur(value: number) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "−" : "";
  return `${sign}€${Math.abs(rounded).toLocaleString("en-GB")}`;
}

export function pct(value: number) {
  return `${Math.max(0, Math.round(value))}%`;
}

export function prettyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function shortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function weekday(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
}

export function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function cabinLabel(cabin: Cabin) {
  if (cabin === "premium") return "Premium economy";
  if (cabin === "business") return "Business";
  return "Economy";
}

export function pointsLabel(amount: number, unit: string) {
  return `${amount.toLocaleString("en-GB")} ${unit}`;
}

export function cppLabel(cpp: number | null) {
  if (cpp == null) return "";
  if (cpp >= 2) return "Excellent value";
  if (cpp >= 1.2) return "Good value";
  if (cpp >= 0.8) return "Fair value";
  return "Weak value";
}
