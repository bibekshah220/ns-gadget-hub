import mongoose from "mongoose";


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
    enum: ["order placed", "pending", "shipped", "delivered", "cancelled"],
    default: "order placed",
  },
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
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
