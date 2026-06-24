import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import authSeller from "@/lib/authSeller";
import Order from "@/models/order";
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

    /* Map the stored order shape onto what the seller Orders UI expects. */
    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      amount: order.totalAmount,
      status: order.status,
      date: order.createdAt,
      address: order.addressId,
      items: order.products.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
      })),
    }));

    return NextResponse.json(
      { success: true, orders: formattedOrders },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
