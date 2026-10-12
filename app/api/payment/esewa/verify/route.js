import { NextResponse } from "next/server";
import crypto from "crypto";
import { completeOrderPayment, failOrderPayment } from "@/lib/payment";

const redirect = (req, path) => NextResponse.redirect(new URL(path, req.nextUrl.origin));

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data");
    const secretKey = process.env.ESEWA_SECRET_KEY;

    /* No default secret: eSewa publishes its sandbox key, so a fallback would
       let anyone sign their own "payment complete" callback. */
    if (!data || !secretKey) {
      return redirect(req, "/payment/failure");
    }

    const parsed = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    const { transaction_code, status, total_amount, transaction_uuid, signed_field_names, signature } =
      parsed;

    if (typeof signed_field_names !== "string" || typeof signature !== "string") {
      return redirect(req, "/payment/failure");
    }

    const message = signed_field_names
      .split(",")
      .map((field) => `${field}=${parsed[field] ?? ""}`)
      .join(",");

    const expected = crypto
      .createHmac("sha256", secretKey)
      .update(message)
      .digest("base64");

    const expectedBuf = Buffer.from(expected);
    const signatureBuf = Buffer.from(signature);

    if (
      expectedBuf.length !== signatureBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, signatureBuf)
    ) {
      console.error("eSewa signature verification failed");
      return redirect(req, "/payment/failure");
    }

    if (status !== "COMPLETE") {
      await failOrderPayment({
        orderId: transaction_uuid,
        paymentRef: transaction_uuid,
        transactionId: transaction_code,
      });
      return redirect(req, "/payment/failure");
    }

    const result = await completeOrderPayment({
      orderId: transaction_uuid,
      provider: "eSewa",
      paymentRef: transaction_uuid,
      /* eSewa sends the amount with thousands separators. */
      paidAmount: Number(String(total_amount).replace(/,/g, "")),
      transactionId: transaction_code,
    });

    return redirect(req, result.ok ? "/payment/success" : "/payment/failure");
  } catch (error) {
    console.error("eSewa verification error:", error);
    return redirect(req, "/payment/failure");
  }
}
