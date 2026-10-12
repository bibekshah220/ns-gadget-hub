import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import Address from "@/models/address";
import { requireAuth } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectToDatabase();
    const address = await Address.find({ userId: String(user._id) }).lean();

    return NextResponse.json({ success: true, address }, { status: 200 });
  } catch (error) {
    console.error("Get address error:", error);
    return NextResponse.json(
      { success: false, message: "Could not load addresses" },
      { status: 500 },
    );
  }
}
