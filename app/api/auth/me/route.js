import { NextResponse } from "next/server";
import { publicUser, requireAuth } from "@/lib/auth";

export async function GET(req) {
  const user = await requireAuth(req);

  if (!user) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  return NextResponse.json({ success: true, user: publicUser(user) }, { status: 200 });
}
