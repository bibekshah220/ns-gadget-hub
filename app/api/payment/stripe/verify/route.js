import { NextResponse } from "next/server";
import Stripe from "stripe";
import { completeOrderPayment, failOrderPayment } from "@/lib/payment";

const redirect = (req, path) => NextResponse.redirect(new URL(path, req.nextUrl.origin));

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  const order_id = searchParams.get("order_id");

  try {
    if (!session_id || !order_id || !process.env.STRIPE_SECRET_KEY) {
      return redirect(req, "/payment/failure");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      await failOrderPayment({
        orderId: order_id,
        paymentRef: session_id,
        transactionId: session.payment_intent,
      });
      return redirect(req, "/payment/failure");
    }

    const result = await completeOrderPayment({
      orderId: order_id,
      provider: "Stripe",
      paymentRef: session.id,
      /* Stripe reports the charge in the smallest currency unit. */
      paidAmount: session.amount_total / 100,
      transactionId: session.payment_intent || session.id,
    });

    return redirect(req, result.ok ? "/payment/success" : "/payment/failure");
  } catch (error) {
    console.error("Stripe verification error:", error);
    return redirect(req, "/payment/failure");
  }
}
