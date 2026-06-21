

import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import authSeller from "@/lib/authSeller";
import Order from "@/models/oder";
import Product from "@/models/product";
import Address from "@/models/address";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectToDatabase();

    /* The Order model has no sellerId, so derive the seller's product ids first. */
    const sellerProducts = await Product.find({ sellerId: userId }).select("_id");
    const sellerProductIds = sellerProducts.map((product) => product._id.toString());

    const orders = await Order.find({
      "products.productId": { $in: sellerProductIds },
    })
      .populate("addressId")
      .populate("products.productId")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}