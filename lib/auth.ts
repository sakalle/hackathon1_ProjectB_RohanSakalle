import { cookies } from "next/headers";
import { deleteSession, getUserBySession, type AppUser } from "./db";

const SESSION = "milla_session";

export function publicOrigin(request: Request) {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim();
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const proto = forwarded || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
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
