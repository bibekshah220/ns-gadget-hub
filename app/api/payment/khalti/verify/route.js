import { NextResponse } from "next/server";
import { completeOrderPayment, failOrderPayment } from "@/lib/payment";

const redirect = (req, path) => NextResponse.redirect(new URL(path, req.nextUrl.origin));

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const pidx = searchParams.get("pidx");
  const purchase_order_id = searchParams.get("purchase_order_id");

  try {
    if (!pidx || !purchase_order_id || !process.env.KHALTI_SECRET_KEY) {
      return redirect(req, "/payment/failure");
    }

    /* The query string is attacker-controlled; Khalti's lookup is the source
       of truth for whether anything was actually paid. */
    const response = await fetch("https://a.khalti.com/api/v2/epayment/lookup/", {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    const data = await response.json();

    if (data.status !== "Completed") {
      await failOrderPayment({
        orderId: purchase_order_id,
        paymentRef: pidx,
        transactionId: data.transaction_id,
      });
      return redirect(req, "/payment/failure");
    }

    const result = await completeOrderPayment({
      orderId: purchase_order_id,
      provider: "Khalti",
      paymentRef: pidx,
      /* Khalti reports paisa. */
      paidAmount: Number(data.total_amount) / 100,
      transactionId: data.transaction_id || pidx,
    });

    return redirect(req, result.ok ? "/payment/success" : "/payment/failure");
  } catch (error) {
    console.error("Khalti verification error:", error);
    return redirect(req, "/payment/failure");
  }
}
