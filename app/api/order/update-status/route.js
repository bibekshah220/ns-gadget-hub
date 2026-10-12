import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import authSeller from "@/lib/authSeller";
import Order from "@/models/order";
import Product from "@/models/product";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { canTransition, STATUS_LABELS } from "@/lib/orderStatus";
import { sendOrderStatusEmail } from "@/lib/mailer";
import { SITE_URL } from "@/lib/site";

const fail = (message, status) =>
  NextResponse.json({ success: false, message }, { status });

export async function POST(req) {
  try {
    const user = await requireAuth(req);

    if (!authSeller(user)) {
      return fail("Unauthorized", 401);
    }

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return fail("orderId and status are required", 400);
    }

    await connectToDatabase();

    const order = await Order.findById(orderId);

    if (!order) {
      return fail("Order not found", 404);
    }

    /* A seller may only touch an order that contains one of their products. */
    const sellerProducts = await Product.find({
      sellerId: String(user._id),
      _id: { $in: order.products.map((item) => item.productId) },
    }).select("_id");

    if (sellerProducts.length === 0) {
      return fail("Unauthorized", 401);
    }

    /* Re-sending the status the order already holds is a no-op: no write, no
       history row, no second email. */
    if (order.status === status) {
      return NextResponse.json({ success: true, status, changed: false }, { status: 200 });
    }

    if (!canTransition(order.status, status)) {
      return fail(
        `Cannot move an order from ${STATUS_LABELS[order.status]} to ${STATUS_LABELS[status] || status}`,
        400,
      );
    }

    order.status = status;
    order.statusHistory.push({ status, at: new Date() });
    await order.save();

    /* The buyer is told the order moved; a mail failure must not roll back a
       status the seller already set. */
    try {
      const buyer = await User.findById(order.userId).select("name email").lean();

      if (buyer?.email) {
        await sendOrderStatusEmail({
          to: buyer.email,
          name: buyer.name,
          orderId: order._id,
          status,
          trackUrl: `${SITE_URL}/my-orders`,
        });
      }
    } catch (error) {
      console.error("Order status email failed:", error);
    }

    return NextResponse.json({ success: true, status, changed: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating order status:", error);
    return fail("Failed to update the order", 500);
  }
}
