import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/config/db";
import User from "@/models/User";

/**
 * Handles the GET request to fetch user data.
 * @param {Request} req 
 * @returns {Promise<Response>}
 */

export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectToDatabase();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
