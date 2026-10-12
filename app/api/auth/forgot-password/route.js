import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import User from "@/models/User";
import { createResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { cleanString, isEmail } from "@/lib/validate";

const RESET_TTL_MS = 30 * 60 * 1000;

/* Identical for every outcome, so the response cannot enumerate accounts. */
const GENERIC_RESPONSE = {
  success: true,
  message: "If that email is registered, a reset link is on its way.",
};

export async function POST(req) {
  try {
    const limit = rateLimit(`forgot:${clientIp(req)}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.ok) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = await req.json();
    const email = cleanString(body.email, 254).toLowerCase();

    if (!isEmail(email)) {
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });

    if (user) {
      const { token, tokenHash } = createResetToken();

      user.resetTokenHash = tokenHash;
      user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
      await user.save();

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (mailError) {
        /* A dead mailbox must not tell the caller the account exists. */
        console.error("Reset email failed:", mailError);
      }
    }

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  }
}
