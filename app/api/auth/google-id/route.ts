import { NextResponse } from "next/server";
import { createSession, upsertGoogleUser } from "@/lib/db";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.redirect(new URL("/login?error=email", origin));
  }
  const name = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const user = upsertGoogleUser({ sub: `gid:${email}`, email, name });
  const session = createSession(user.id);
  const response = NextResponse.redirect(new URL("/", origin));
  response.cookies.set("milla_session", session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
