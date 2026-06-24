import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import Order from "@/models/order";
import Stripe from "stripe";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");
    const order_id = searchParams.get("order_id");

    if (!session_id || !order_id) {
      return NextResponse.redirect(new URL("/payment/failure", req.url));
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      await connectToDatabase();
      await Order.findByIdAndUpdate(order_id, {
        paymentStatus: "Completed",
        transactionId: session.payment_intent || session_id,
        status: "order placed" // Update order status as well
      });
      return NextResponse.redirect(new URL("/payment/success", req.url));
    } else {
      await connectToDatabase();
      await Order.findByIdAndUpdate(order_id, {
        paymentStatus: "Failed",
        transactionId: session.payment_intent || session_id
      });
      return NextResponse.redirect(new URL("/payment/failure", req.url));
    }

  } catch (error) {
    console.error("Stripe verification error:", error);
    return NextResponse.redirect(new URL("/payment/failure", req.url));
  }
}
