import { NextResponse } from "next/server";
import { createSession, loginWithPassword } from "@/lib/db";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "");
  try {
    const user = loginWithPassword({ email, password, name });
    const session = createSession(user.id);
    const response = NextResponse.redirect(new URL("/", origin));
    response.cookies.set("milla_session", session, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign in.";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, origin));
  }
}
