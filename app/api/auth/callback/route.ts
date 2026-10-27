import { NextResponse } from "next/server";
import { createSession, upsertGoogleUser } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const fail = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, origin));
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = request.headers.get("cookie") ?? "";
  const saved = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("milla_oauth_state="))?.slice("milla_oauth_state=".length);
  if (!code || !state || !saved || saved !== state) return fail("state");
  if (url.searchParams.get("error")) return fail("denied");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("config");

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${origin}/api/auth/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) return fail("google");
  const token = (await tokenResponse.json()) as { id_token?: string };
  if (!token.id_token) return fail("google");

  const infoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token.id_token)}`);
  if (!infoResponse.ok) return fail("google");
  const info = (await infoResponse.json()) as {
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: string;
    name?: string;
    picture?: string;
  };
  if (info.aud !== clientId || !info.sub || !info.email || info.email_verified === "false") return fail("google");

  const user = upsertGoogleUser({
    sub: info.sub,
    email: info.email,
    name: info.name?.trim() || info.email.split("@")[0],
    picture: info.picture,
  });
  const session = createSession(user.id);
  const response = NextResponse.redirect(new URL("/", origin));
  response.cookies.set("milla_session", session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set("milla_oauth_state", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
