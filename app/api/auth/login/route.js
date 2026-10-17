import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import User from "@/models/User";
import { publicUser, sessionCookieOptions, signSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/passwordHash";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { cleanString, isEmail } from "@/lib/validate";

/* Compared against when the email is unknown, so both paths cost the same.
   Same algorithm as a real stored hash, or the timing difference would say
   which addresses are registered. */
const DUMMY_HASH =
  "scrypt$32768$8$1$/IO8rt1ntTU5TAsBr3EWGQ==$6yydper/bhCAJpHKEPkxbyszbma9o3ZMRz4dpMLu56+IOclUxdTp+pyRtBe85YTDQFJzvU/tutrLhdc2tod4oQ==";

const tooMany = (retryAfter) =>
  NextResponse.json(
    { success: false, message: "Too many attempts. Try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );

export async function POST(req) {
  try {
    /* A wide per-IP ceiling only, because an office, a campus or a mobile
       carrier puts thousands of legitimate users behind one address: keying
       the tight limit on the IP alone locked all of them out after ten
       attempts between them. */
    const ipLimit = rateLimit(`login-ip:${clientIp(req)}`, {
      limit: 300,
      windowMs: 15 * 60 * 1000,
    });

    if (!ipLimit.ok) {
      return tooMany(ipLimit.retryAfter);
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

    /* The brute-force defence proper: per account, so one targeted address
       cannot be ground down regardless of how many addresses attack it. */
    const accountLimit = rateLimit(`login-account:${email}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!accountLimit.ok) {
      return tooMany(accountLimit.retryAfter);
    }

    await connectToDatabase();

    const user = await User.findOne({ email }).select("+password");
    const matches = await verifyPassword(password, user?.password || DUMMY_HASH);

    /* One message for both failures: never reveal which emails are registered. */
    if (!user || !matches) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 },
      );
    }

    /* Accounts predating the scrypt switch are upgraded here, once, silently. */
    if (needsRehash(user.password)) {
      await User.updateOne({ _id: user._id }, { password: await hashPassword(password) });
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
