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
    required: true,
  },
  status: {
    type: String,
    enum: ["order placed", "pending", "shipped", "delivered", "cancelled"],
    default: "order placed",
  },
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;