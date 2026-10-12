import connectToDatabase from "@/config/db";
import Order from "@/models/order";
import { isValidObjectId } from "@/lib/validate";

/**
 * Settle a gateway callback against the order it was issued for.
 *
 * Every check here exists because the callback URL is reachable by anyone:
 * the order must be the one this gateway reference was minted for, the
 * gateway must have charged the amount the order is actually worth, and a
 * replayed callback must not produce a second state change.
 *
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export const completeOrderPayment = async ({
  orderId,
  provider,
  paymentRef,
  paidAmount,
  transactionId,
}) => {
  if (!isValidObjectId(orderId) || !paymentRef) {
    return { ok: false, reason: "bad-reference" };
  }

  await connectToDatabase();

  const order = await Order.findById(orderId);

  if (!order) {
    return { ok: false, reason: "order-not-found" };
  }

  if (order.paymentStatus === "Completed") {
    /* Replay of a callback we already settled: succeed without writing again. */
    return { ok: true, reason: "already-completed" };
  }

  if (order.paymentMethod !== provider || order.paymentRef !== paymentRef) {
    console.error(
      `Payment reference mismatch on order ${orderId} (${provider}/${paymentRef})`,
    );
    return { ok: false, reason: "reference-mismatch" };
  }

  if (Number(paidAmount) !== Number(order.totalAmount)) {
    console.error(
      `Payment amount mismatch on order ${orderId}: paid ${paidAmount}, owed ${order.totalAmount}`,
    );
    return { ok: false, reason: "amount-mismatch" };
  }

  order.paymentStatus = "Completed";
  order.transactionId = transactionId || paymentRef;
  order.status = "order placed";
  await order.save();

  return { ok: true };
};

/** Record a failed attempt without ever flipping a paid order back. */
export const failOrderPayment = async ({ orderId, paymentRef, transactionId }) => {
  if (!isValidObjectId(orderId)) {
    return;
  }

  await connectToDatabase();

  await Order.updateOne(
    { _id: orderId, paymentRef, paymentStatus: { $ne: "Completed" } },
    { paymentStatus: "Failed", transactionId: transactionId || paymentRef || "" },
  );
};
