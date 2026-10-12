import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import User from "@/models/User";
import { publicUser, sessionCookieOptions, signSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { cleanString, isEmail, passwordProblem } from "@/lib/validate";

export async function POST(req) {
  try {
    /* 10 rather than 5: rejected attempts count too, and a mistyped password
       policy costs several tries. Shared/NAT addresses are common here, so a
       tight cap locks out legitimate households. */
    const limit = rateLimit(`register:${clientIp(req)}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.ok) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = await req.json();
    const name = cleanString(body.name, 80);
    const email = cleanString(body.email, 254).toLowerCase();
    const password = body.password;

    if (!name || !isEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid name and email address" },
        { status: 400 },
      );
    }

    const problem = passwordProblem(password);

    if (problem) {
      return NextResponse.json({ success: false, message: problem }, { status: 400 });
    }

    await connectToDatabase();

    if (await User.exists({ email })) {
      return NextResponse.json(
        { success: false, message: "An account with that email already exists" },
        { status: 409 },
      );
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
    });

    const response = NextResponse.json(
      { success: true, user: publicUser(user) },
      { status: 201 },
    );

    response.cookies.set(SESSION_COOKIE, signSessionToken(user), sessionCookieOptions());

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: "Could not create the account" },
      { status: 500 },
    );
  }
}
