import crypto from "crypto";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { SAMPLE_WALLET } from "./programs";
import type { AwardDay, BuiltSearch, Offer, ProgramQuote, SearchInput } from "./types";

export interface LoyaltyRow {
  id: string;
  program_id: string;
  balance: number;
  updated_at: string;
}

export interface SearchRow {
  id: string;
  mode: string;
  title: string;
  input: SearchInput;
  normalPrice: number;
  bestPrice: number;
  savingsEur: number;
  savingsPct: number;
  offers: Offer[];
  calendar: BuiltSearch["calendar"];
  awardMonth: AwardDay[];
  programBoard: ProgramQuote[];
  notes: string[];
  createdAt: string;
}

export interface SavedRow {
  id: string;
  searchId: string;
  offerId: string;
  nickname: string;
  createdAt: string;
  title: string;
  savingsEur: number;
  hackedPrice: number;
  normalPrice: number;
}

export interface AlertRow {
  id: string;
  searchId: string;
  offerId: string | null;
  targetPrice: number;
  active: boolean;
  createdAt: string;
  lastPrice: number | null;
  triggered: boolean;
  title: string;
  email: string | null;
}

export interface BookingRow {
  id: string;
  searchId: string;
  offerId: string;
  path: string;
  status: string;
  passengers: { name: string; kind: string }[];
  email: string;
  confirmation: string;
  totalPaid: number;
  savingsEur: number;
  last4: string | null;
  createdAt: string;
  title: string;
}

const globalForDb = globalThis as unknown as { milla?: Database.Database };

export function getDb() {
  if (!globalForDb.milla) {
    const dir = path.join(process.cwd(), "data");
    fs.mkdirSync(dir, { recursive: true });
    const db = new Database(path.join(dir, "milla.db"));
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS loyalty (
        id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL UNIQUE,
        balance INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS searches (
        id TEXT PRIMARY KEY,
        mode TEXT NOT NULL,
        title TEXT NOT NULL,
        input_json TEXT NOT NULL,
        normal_price INTEGER NOT NULL,
        best_price INTEGER NOT NULL,
        savings_eur INTEGER NOT NULL,
        savings_pct REAL NOT NULL,
        offers_json TEXT NOT NULL,
        calendar_json TEXT NOT NULL,
        notes_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS saved_trips (
        id TEXT PRIMARY KEY,
        search_id TEXT NOT NULL,
        offer_id TEXT NOT NULL,
        nickname TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(search_id, offer_id)
      );
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        search_id TEXT NOT NULL,
        offer_id TEXT,
        target_price INTEGER NOT NULL,
        email TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        last_price INTEGER,
        triggered INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        search_id TEXT NOT NULL,
        offer_id TEXT NOT NULL,
        path TEXT NOT NULL,
        status TEXT NOT NULL,
        passenger_json TEXT NOT NULL,
        email TEXT NOT NULL,
        confirmation TEXT NOT NULL,
        total_paid INTEGER NOT NULL,
        savings_eur INTEGER NOT NULL,
        last4 TEXT,
        created_at TEXT NOT NULL
      );
    `);
    const profile = db.prepare("SELECT id FROM profile WHERE id = ?").get("local");
    if (!profile) {
      db.prepare("INSERT INTO profile (id, name, created_at) VALUES (?, ?, ?)").run("local", "Traveller", new Date().toISOString());
      const insertMiles = db.prepare(
        "INSERT INTO loyalty (id, program_id, balance, updated_at) VALUES (?, ?, ?, ?)",
      );
      for (const [programId, balance] of Object.entries(SAMPLE_WALLET)) {
        insertMiles.run(`loy_${programId}`, programId, balance, new Date().toISOString());
      }
    }
    globalForDb.milla = db;
  }
  ensureAccounts(globalForDb.milla);
  return globalForDb.milla;
}

function ensureAccounts(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_sub TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      picture TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      role TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS chat_owner_idx ON chat_messages (owner_id, created_at);
  `);
  const columns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "password_hash")) {
    db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
  }
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
}

export function loginWithPassword(input: { email: string; password: string; name: string }): AppUser {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().slice(0, 80);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Use a real email address.");
  if (input.password.length < 6) throw new Error("Use a password of at least 6 characters.");
  if (name.length < 2) throw new Error("Add your name.");
  const db = getDb();
  const existing = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email) as
    | { id: string; password_hash: string | null }
    | undefined;
  if (existing?.password_hash) {
    if (!passwordMatches(input.password, existing.password_hash)) throw new Error("That password does not match this email.");
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, existing.id);
    return getUser(existing.id)!;
  }
  if (existing && !existing.password_hash) {
    const hash = hashPassword(input.password);
    db.prepare("UPDATE users SET name = ?, password_hash = ? WHERE id = ?").run(name, hash, existing.id);
    return getUser(existing.id)!;
  }
  const id = `usr_${crypto.randomUUID().slice(0, 8)}`;
  db.prepare(
    `INSERT INTO users (id, google_sub, email, name, picture, created_at, password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, `local:${email}`, email, name, null, new Date().toISOString(), hashPassword(input.password));
  return getUser(id)!;
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function passwordMatches(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = crypto.scryptSync(password, salt, 32);
  const previous = Buffer.from(hash, "hex");
  if (next.length !== previous.length) return false;
  return crypto.timingSafeEqual(next, previous);
}

export function createSession(userId: string) {
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  getDb().prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(id, userId, expires);
  return id;
}

export function getUserBySession(sessionId: string): AppUser | null {
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.picture, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
    )
    .get(sessionId) as { id: string; email: string; name: string; picture: string | null; expires_at: string } | undefined;
  if (!row) return null;
  if (row.expires_at < new Date().toISOString()) {
    getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, picture: row.picture };
}

export function deleteSession(sessionId: string) {
  getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

function getUser(id: string): AppUser | null {
  const row = getDb().prepare("SELECT id, email, name, picture FROM users WHERE id = ?").get(id) as AppUser | undefined;
  return row ?? null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  body: string;
  createdAt: string;
}

export function listChat(ownerId: string, limit = 20): ChatMessage[] {
  const rows = getDb()
    .prepare(
      `SELECT id, role, body, created_at FROM chat_messages WHERE owner_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(ownerId, limit) as { id: string; role: string; body: string; created_at: string }[];
  return rows
    .reverse()
    .map((row) => ({
      id: row.id,
      role: row.role === "assistant" ? "assistant" : "user",
      body: row.body,
      createdAt: row.created_at,
    }));
}

export function addChat(ownerId: string, role: "user" | "assistant", body: string) {
  const id = `chat_${crypto.randomUUID().slice(0, 8)}`;
  getDb()
    .prepare("INSERT INTO chat_messages (id, owner_id, role, body, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, ownerId, role, body.slice(0, 2000), new Date().toISOString());
  return id;
}

export function getProfile() {
  const row = getDb().prepare("SELECT id, name, created_at FROM profile WHERE id = ?").get("local") as {
    id: string;
    name: string;
    created_at: string;
  };
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

export function setProfileName(name: string) {
  const clean = name.trim().slice(0, 40);
  if (!clean) throw new Error("Add a name.");
  getDb().prepare("UPDATE profile SET name = ? WHERE id = ?").run(clean, "local");
  return getProfile();
}

export function listLoyalty(): LoyaltyRow[] {
  return getDb().prepare("SELECT id, program_id, balance, updated_at FROM loyalty ORDER BY program_id").all() as LoyaltyRow[];
}

export function balancesMap() {
  const map: Record<string, number> = {};
  for (const row of listLoyalty()) map[row.program_id] = row.balance;
  return map;
}

export function saveWallet(entries: { programId: string; balance: number }[]) {
  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO loyalty (id, program_id, balance, updated_at)
    VALUES (@id, @program_id, @balance, @updated_at)
    ON CONFLICT(program_id) DO UPDATE SET balance = excluded.balance, updated_at = excluded.updated_at
  `);
  const remove = db.prepare("DELETE FROM loyalty WHERE program_id = ?");
  const tx = db.transaction((rows: { programId: string; balance: number }[]) => {
    for (const row of rows) {
      const balance = Math.max(0, Math.round(row.balance));
      if (!balance) {
        remove.run(row.programId);
        continue;
      }
      upsert.run({
        id: `loy_${row.programId}`,
        program_id: row.programId,
        balance,
        updated_at: new Date().toISOString(),
      });
    }
  });
  tx(entries);
  return listLoyalty();
}

export function applySampleWallet() {
  return saveWallet(Object.entries(SAMPLE_WALLET).map(([programId, balance]) => ({ programId, balance })));
}

export function saveSearch(input: SearchInput, built: BuiltSearch) {
  const id = `srch_${crypto.randomUUID().slice(0, 8)}`;
  getDb()
    .prepare(
      `INSERT INTO searches (
        id, mode, title, input_json, normal_price, best_price, savings_eur, savings_pct,
        offers_json, calendar_json, notes_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.mode,
      built.title,
      JSON.stringify(input),
      built.normalPrice,
      built.bestPrice,
      built.savingsEur,
      built.savingsPct,
      JSON.stringify(built.offers),
      JSON.stringify({ week: built.calendar, month: built.awardMonth, board: built.programBoard }),
      JSON.stringify(built.notes),
      new Date().toISOString(),
    );
  return id;
}

export function getSearch(id: string): SearchRow | null {
  const row = getDb().prepare("SELECT * FROM searches WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapSearch(row);
}

export function listSearches(limit = 12): SearchRow[] {
  const rows = getDb().prepare("SELECT * FROM searches ORDER BY created_at DESC LIMIT ?").all(limit) as Record<string, unknown>[];
  return rows.map(mapSearch);
}

function mapSearch(row: Record<string, unknown>): SearchRow {
  return {
    id: String(row.id),
    mode: String(row.mode),
    title: String(row.title),
    input: JSON.parse(String(row.input_json)) as SearchInput,
    normalPrice: Number(row.normal_price),
    bestPrice: Number(row.best_price),
    savingsEur: Number(row.savings_eur),
    savingsPct: Number(row.savings_pct),
    offers: JSON.parse(String(row.offers_json)) as Offer[],
    ...unpackCalendar(String(row.calendar_json)),
    notes: JSON.parse(String(row.notes_json)),
    createdAt: String(row.created_at),
  };
}

function unpackCalendar(raw: string) {
  const parsed = JSON.parse(raw) as BuiltSearch["calendar"] | { week?: BuiltSearch["calendar"]; month?: AwardDay[]; board?: ProgramQuote[] };
  if (Array.isArray(parsed)) return { calendar: parsed, awardMonth: [] as AwardDay[], programBoard: [] as ProgramQuote[] };
  return {
    calendar: parsed.week ?? [],
    awardMonth: parsed.month ?? [],
    programBoard: parsed.board ?? [],
  };
}

export function saveTrip(searchId: string, offerId: string) {
  const search = getSearch(searchId);
  if (!search) throw new Error("That search no longer exists.");
  const offer = search.offers.find((item) => item.id === offerId);
  if (!offer) throw new Error("That option is not on this search.");
  if (offer.locked) throw new Error("Add the miles before saving this as a price you can take.");
  const id = `save_${crypto.randomUUID().slice(0, 8)}`;
  getDb()
    .prepare(
      `INSERT INTO saved_trips (id, search_id, offer_id, nickname, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(search_id, offer_id) DO NOTHING`,
    )
    .run(id, searchId, offerId, search.title, new Date().toISOString());
  return listSaved();
}

export function listSaved(): SavedRow[] {
  const rows = getDb()
    .prepare(
      `SELECT s.id, s.search_id, s.offer_id, s.nickname, s.created_at, q.title, q.offers_json, q.normal_price
       FROM saved_trips s JOIN searches q ON q.id = s.search_id
       ORDER BY s.created_at DESC`,
    )
    .all() as Record<string, unknown>[];
  return rows.map((row) => {
    const offers = JSON.parse(String(row.offers_json)) as Offer[];
    const offer = offers.find((item) => item.id === row.offer_id);
    return {
      id: String(row.id),
      searchId: String(row.search_id),
      offerId: String(row.offer_id),
      nickname: String(row.nickname),
      createdAt: String(row.created_at),
      title: String(row.title),
      savingsEur: offer?.savingsEur ?? 0,
      hackedPrice: offer?.hackedPrice ?? 0,
      normalPrice: Number(row.normal_price),
    };
  });
}

export function deleteSaved(id: string) {
  getDb().prepare("DELETE FROM saved_trips WHERE id = ?").run(id);
}

export function createAlert(searchId: string, targetPrice: number, email?: string, offerId?: string) {
  const search = getSearch(searchId);
  if (!search) throw new Error("That search no longer exists.");
  const price = Math.round(targetPrice);
  if (price < 1) throw new Error("Set a target above zero.");
  const offer = offerId ? search.offers.find((item) => item.id === offerId) : undefined;
  const current = offer?.hackedPrice ?? search.bestPrice;
  const id = `alrt_${crypto.randomUUID().slice(0, 8)}`;
  getDb()
    .prepare(
      `INSERT INTO alerts (id, search_id, offer_id, target_price, email, active, created_at, last_price, triggered)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    )
    .run(id, searchId, offerId ?? null, price, email?.trim() || null, new Date().toISOString(), current, current <= price ? 1 : 0);
  return listAlerts();
}

export function listAlerts(): AlertRow[] {
  refreshAlerts();
  const rows = getDb()
    .prepare(
      `SELECT a.*, q.title FROM alerts a JOIN searches q ON q.id = a.search_id WHERE a.active = 1 ORDER BY a.created_at DESC`,
    )
    .all() as Record<string, unknown>[];
  return rows.map((row) => ({
    id: String(row.id),
    searchId: String(row.search_id),
    offerId: row.offer_id ? String(row.offer_id) : null,
    targetPrice: Number(row.target_price),
    active: Boolean(row.active),
    createdAt: String(row.created_at),
    lastPrice: row.last_price == null ? null : Number(row.last_price),
    triggered: Boolean(row.triggered),
    title: String(row.title),
    email: row.email ? String(row.email) : null,
  }));
}

export function deleteAlert(id: string) {
  getDb().prepare("UPDATE alerts SET active = 0 WHERE id = ?").run(id);
}

function refreshAlerts() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM alerts WHERE active = 1").all() as Record<string, unknown>[];
  const update = db.prepare("UPDATE alerts SET last_price = ?, triggered = ? WHERE id = ?");
  for (const row of rows) {
    const search = getSearch(String(row.search_id));
    if (!search) continue;
    const offer = row.offer_id ? search.offers.find((item) => item.id === row.offer_id) : undefined;
    const calendarLow = search.calendar.reduce((min, day) => Math.min(min, day.price), search.bestPrice);
    const current = Math.min(offer?.hackedPrice ?? search.bestPrice, calendarLow);
    update.run(current, current <= Number(row.target_price) ? 1 : 0, String(row.id));
  }
}

export function findBooking(searchId: string, offerId: string): BookingRow | null {
  const row = getDb()
    .prepare("SELECT id FROM bookings WHERE search_id = ? AND offer_id = ?")
    .get(searchId, offerId) as { id: string } | undefined;
  return row ? getBooking(row.id) : null;
}

export function assertBookingInput(input: {
  searchId: string;
  offerId: string;
  email: string;
  passengers: { name: string; kind: string }[];
  cardNumber?: string;
}) {
  const search = getSearch(input.searchId);
  if (!search) throw new Error("That search no longer exists.");
  const offer = search.offers.find((item) => item.id === input.offerId);
  if (!offer || offer.locked) throw new Error("This option cannot be booked yet.");
  const email = input.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Add a real email address.");
  const expected = search.input.adults + search.input.children;
  if (input.passengers.length !== expected) throw new Error("Add every traveller on the booking.");
  if (input.passengers.some((person) => person.name.trim().length < 3)) {
    throw new Error("Each name needs at least three letters, as it will appear on the ticket.");
  }
  let last4: string | null = null;
  if (offer.bookPath === "cash") {
    const digits = (input.cardNumber ?? "").replace(/\s+/g, "");
    if (!luhn(digits)) throw new Error("That card number does not pass a basic check.");
    last4 = digits.slice(-4);
  }
  return { search, offer, email, last4 };
}

export function createBooking(input: {
  searchId: string;
  offerId: string;
  email: string;
  passengers: { name: string; kind: string }[];
  cardNumber?: string;
  confirmation?: string;
}) {
  const existing = findBooking(input.searchId, input.offerId);
  if (existing) return existing;
  const { offer, email, last4 } = assertBookingInput(input);
  const id = `book_${crypto.randomUUID().slice(0, 8)}`;
  const confirmation = input.confirmation?.trim() || `MILLA-${id.slice(-6).toUpperCase()}`;
  getDb()
    .prepare(
      `INSERT INTO bookings (
        id, search_id, offer_id, path, status, passenger_json, email, confirmation, total_paid, savings_eur, last4, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.searchId,
      input.offerId,
      offer.bookPath,
      "confirmed",
      JSON.stringify(input.passengers.map((person) => ({ name: person.name.trim(), kind: person.kind }))),
      email,
      confirmation,
      offer.hackedPrice,
      offer.savingsEur,
      last4,
      new Date().toISOString(),
    );
  return getBooking(id)!;
}

export function getBooking(id: string): BookingRow | null {
  const row = getDb()
    .prepare(
      `SELECT b.*, q.title FROM bookings b JOIN searches q ON q.id = b.search_id WHERE b.id = ?`,
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapBooking(row);
}

export function listBookings(): BookingRow[] {
  const rows = getDb()
    .prepare(`SELECT b.*, q.title FROM bookings b JOIN searches q ON q.id = b.search_id ORDER BY b.created_at DESC`)
    .all() as Record<string, unknown>[];
  return rows.map(mapBooking);
}

function mapBooking(row: Record<string, unknown>): BookingRow {
  return {
    id: String(row.id),
    searchId: String(row.search_id),
    offerId: String(row.offer_id),
    path: String(row.path),
    status: String(row.status),
    passengers: JSON.parse(String(row.passenger_json)),
    email: String(row.email),
    confirmation: String(row.confirmation),
    totalPaid: Number(row.total_paid),
    savingsEur: Number(row.savings_eur),
    last4: row.last4 ? String(row.last4) : null,
    createdAt: String(row.created_at),
    title: String(row.title),
  };
}

export function getSummary() {
  listAlerts();
  const db = getDb();
  const booked = db.prepare("SELECT COALESCE(SUM(savings_eur), 0) AS savings, COUNT(*) AS count FROM bookings").get() as {
    savings: number;
    count: number;
  };
  const saved = db.prepare("SELECT COUNT(*) AS count FROM saved_trips").get() as { count: number };
  const alerts = db.prepare("SELECT COUNT(*) AS count FROM alerts WHERE active = 1").get() as { count: number };
  const triggered = db.prepare("SELECT COUNT(*) AS count FROM alerts WHERE active = 1 AND triggered = 1").get() as {
    count: number;
  };
  const watched = listSaved().reduce((sum, trip) => sum + trip.savingsEur, 0);
  return {
    bookedSavings: booked.savings,
    bookings: booked.count,
    savedTrips: saved.count,
    watchedSavings: watched,
    alerts: alerts.count,
    triggered: triggered.count,
  };
}

function luhn(digits: string) {
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
