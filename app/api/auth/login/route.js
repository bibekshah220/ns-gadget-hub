import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import User from "@/models/User";
import { publicUser, sessionCookieOptions, signSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { cleanString, isEmail } from "@/lib/validate";

/* Compared against when the email is unknown, so both paths cost the same. */
const DUMMY_HASH = "$2b$12$aYOuagQ5oU820rQgpXt8c.IDl9Xo5xps9aAOqLDfV6xGiIUEsTa3S";

export async function POST(req) {
  try {
    const limit = rateLimit(`login:${clientIp(req)}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!limit.ok) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = await req.json();
    const email = cleanString(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!isEmail(email) || !password) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 },
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email }).select("+password");
    const matches = await bcrypt.compare(password, user?.password || DUMMY_HASH);

    /* One message for both failures: never reveal which emails are registered. */
    if (!user || !matches) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const response = NextResponse.json(
      { success: true, user: publicUser(user) },
      { status: 200 },
    );

    response.cookies.set(SESSION_COOKIE, signSessionToken(user), sessionCookieOptions());

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Could not sign in" },
      { status: 500 },
    );
  }
}
