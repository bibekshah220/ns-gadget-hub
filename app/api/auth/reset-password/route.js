import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import User from "@/models/User";
import { clearSessionCookie, hashResetToken } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { passwordProblem } from "@/lib/validate";

export async function POST(req) {
  try {
    const limit = rateLimit(`reset:${clientIp(req)}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.ok) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const { token, password } = await req.json();

    if (typeof token !== "string" || token.length !== 64) {
      return NextResponse.json(
        { success: false, message: "This reset link is invalid or has expired" },
        { status: 400 },
      );
    }

    const problem = passwordProblem(password);

    if (problem) {
      return NextResponse.json({ success: false, message: problem }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({
      resetTokenHash: hashResetToken(token),
      resetTokenExpires: { $gt: new Date() },
    }).select("+resetTokenHash +resetTokenExpires");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "This reset link is invalid or has expired" },
        { status: 400 },
      );
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    /* Invalidate every session issued before the password changed. */
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    return clearSessionCookie(
      NextResponse.json(
        { success: true, message: "Password updated. Sign in with your new password." },
        { status: 200 },
      ),
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Could not reset the password" },
      { status: 500 },
    );
  }
}
