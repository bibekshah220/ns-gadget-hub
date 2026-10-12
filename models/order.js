import mongoose from "mongoose";
import { ORDER_STATUSES } from "@/lib/orderStatus";


const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  products: [
    {
      productId: {
        type: String,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  addressId: {
    type: String,
    ref: "Address",
    required: true,
  },
  status: {
    type: String,
    enum: ORDER_STATUSES,
    default: "order placed",
  },
  /* Every status the order has held, so the buyer's tracker can show when
     each step happened instead of only where the order is now. */
  statusHistory: [
    {
      status: {
        type: String,
        enum: ORDER_STATUSES,
        required: true,
      },
      at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  paymentMethod: {
    type: String,
    enum: ["COD", "Khalti", "eSewa", "Stripe"],
    default: "COD",
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  transactionId: {
    type: String,
    default: "",
  },
  /* Gateway-side id (Stripe session, Khalti pidx, eSewa uuid) bound at checkout
     so a verify callback cannot be replayed against a different order. */
  paymentRef: {
    type: String,
    default: "",
  },
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
