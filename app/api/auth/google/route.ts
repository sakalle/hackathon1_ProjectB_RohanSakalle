import { NextResponse } from "next/server";
import { googleReady } from "@/lib/auth";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!googleReady()) return NextResponse.redirect(new URL("/login?error=config", origin));
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: `${origin}/api/auth/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  response.cookies.set("milla_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return response;
}
