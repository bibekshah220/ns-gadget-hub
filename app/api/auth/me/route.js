import { NextResponse } from "next/server";
import { publicUser, requireAuthSession, slideSession } from "@/lib/auth";

export async function GET(req) {
  const session = await requireAuthSession(req);

  if (!session) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  const response = NextResponse.json(
    { success: true, user: publicUser(session.user) },
    { status: 200 },
  );

  return slideSession(response, session.user, session.payload);
}
