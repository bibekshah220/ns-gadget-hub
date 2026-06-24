import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import Order from "@/models/order";
import Product from "@/models/product";
import Address from "@/models/address";

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

    const orders = await Order.find({ userId })
      .populate("addressId")
      .populate("products.productId")
      .sort({ createdAt: -1 })
      .lean();

    /* Map the stored order shape onto what the My Orders UI expects. */
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
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
