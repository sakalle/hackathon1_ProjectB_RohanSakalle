import { NextResponse } from "next/server";
import { endSession, publicOrigin } from "@/lib/auth";

export async function GET(request: Request) {
  endSession();
  const response = NextResponse.redirect(new URL("/", publicOrigin(request)));
  response.cookies.set("milla_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}

export async function POST(request: Request) {
  return GET(request);
}
