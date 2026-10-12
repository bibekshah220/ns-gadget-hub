import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { cleanString, isEmail } from "@/lib/validate";
import { sendContactNotification } from "@/lib/mailer";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    userId: { type: String, default: null },
    handled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const ContactMessage =
  mongoose.models.ContactMessage || mongoose.model("ContactMessage", contactSchema);

export async function POST(req) {
  try {
    const limit = rateLimit(`contact:${clientIp(req)}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.ok) {
      return NextResponse.json(
        { success: false, message: "Too many messages. Try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = await req.json();

    /* Honeypot: a real person never fills a field they cannot see. */
    if (cleanString(body.website, 50)) {
      return NextResponse.json({ success: true, message: "Thanks, we'll be in touch." });
    }

    const payload = {
      name: cleanString(body.name, 80),
      email: cleanString(body.email, 254).toLowerCase(),
      subject: cleanString(body.subject, 120),
      message: cleanString(body.message, 4000),
    };

    if (!payload.name || !payload.subject || payload.message.length < 10) {
      return NextResponse.json(
        { success: false, message: "Fill in your name, a subject, and a message of at least 10 characters." },
        { status: 400 },
      );
    }

    if (!isEmail(payload.email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address so we can reply." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    /* Stored first: a message must survive a mail outage. */
    const user = await requireAuth(req);
    await ContactMessage.create({ ...payload, userId: user ? String(user._id) : null });

    try {
      await sendContactNotification(payload);
    } catch (mailError) {
      console.error("Contact notification failed:", mailError);
    }

    return NextResponse.json(
      { success: true, message: "Thanks, we'll be in touch." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, message: "Could not send the message" },
      { status: 500 },
    );
  }
}
