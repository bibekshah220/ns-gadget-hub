import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/product";
import { requireAuth } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    if (!authSeller(user)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectToDatabase();

    const products = await Product.find({ sellerId: String(user._id) })
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ success: true, products }, { status: 200 });
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
