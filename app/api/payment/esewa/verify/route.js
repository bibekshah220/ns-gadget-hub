import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import Order from "@/models/order";
import crypto from "crypto";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data");

    if (!data) {
      return NextResponse.redirect(new URL("/payment/failure", req.url));
    }

    // Decode base64 data
    const decodedData = Buffer.from(data, "base64").toString("utf-8");
    const parsedData = JSON.parse(decodedData);

    const { transaction_code, status, total_amount, transaction_uuid, product_code, signed_field_names, signature } = parsedData;

    // Verify signature
    const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
    
    // Construct message from signed_field_names
    const fields = signed_field_names.split(",");
    const messageParams = fields.map(field => `${field}=${parsedData[field] || ''}`);
    const message = messageParams.join(",");

    const hash = crypto.createHmac("sha256", secretKey).update(message).digest("base64");

    if (hash !== signature) {
      console.error("eSewa signature verification failed");
      return NextResponse.redirect(new URL("/payment/failure", req.url));
    }

    if (status === "COMPLETE") {
      await connectToDatabase();
      await Order.findByIdAndUpdate(transaction_uuid, {
        paymentStatus: "Completed",
        transactionId: transaction_code,
        status: "order placed" // Update order status as well
      });
      return NextResponse.redirect(new URL("/payment/success", req.url));
    } else {
      await connectToDatabase();
      await Order.findByIdAndUpdate(transaction_uuid, {
        paymentStatus: "Failed",
        transactionId: transaction_code
      });
      return NextResponse.redirect(new URL("/payment/failure", req.url));
    }

  } catch (error) {
    console.error("eSewa verification error:", error);
    return NextResponse.redirect(new URL("/payment/failure", req.url));
  }
}
