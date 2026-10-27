import { cookies } from "next/headers";
import { deleteSession, getUserBySession, type AppUser } from "./db";

const SESSION = "milla_session";

export function googleReady() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function currentUser(): AppUser | null {
  const token = cookies().get(SESSION)?.value;
  if (!token) return null;
  return getUserBySession(token);
}

export function sessionCookie() {
  return cookies().get(SESSION)?.value ?? null;
}

export function endSession() {
  const token = sessionCookie();
  if (token) deleteSession(token);
}
