import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import Order from "@/models/order";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pidx = searchParams.get("pidx");
    const purchase_order_id = searchParams.get("purchase_order_id");

    if (!pidx || !purchase_order_id) {
      return NextResponse.redirect(new URL("/payment/failure", req.url));
    }

    // Call Khalti Lookup API
    const response = await fetch("https://a.khalti.com/api/v2/epayment/lookup/", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pidx })
    });

    const data = await response.json();

    if (data.status === "Completed") {
      await connectToDatabase();
      await Order.findByIdAndUpdate(purchase_order_id, {
        paymentStatus: "Completed",
        transactionId: data.transaction_id,
        status: "order placed" // Update order status as well
      });
      return NextResponse.redirect(new URL("/payment/success", req.url));
    } else {
      await connectToDatabase();
      await Order.findByIdAndUpdate(purchase_order_id, {
        paymentStatus: "Failed",
        transactionId: data.transaction_id || pidx
      });
      return NextResponse.redirect(new URL("/payment/failure", req.url));
    }

  } catch (error) {
    console.error("Khalti verification error:", error);
    return NextResponse.redirect(new URL("/payment/failure", req.url));
  }
}
