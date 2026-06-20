import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import Product from "@/models/product";
import User from "@/models/User";
import { inngest } from "@/config/inngest";

/* Nepal levies 13% VAT on the order subtotal. */
const NEPAL_VAT_RATE = 0.13;

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { address, items } = await req.json();

    if (!address || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid order data" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    /* Load every referenced product in one query and key it by id for lookup. */
    const productIds = items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    /* Build order line items and compute the subtotal from trusted DB prices. */
    const orderProducts = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(String(item.product));

      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product not found: ${item.product}` },
          { status: 404 },
        );
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          { success: false, message: "Invalid quantity for an item" },
          { status: 400 },
        );
      }

      orderProducts.push({ productId: product._id.toString(), quantity });
      subtotal += product.offerPrice * quantity;
    }

    /* Apply Nepal VAT (13%) on top of the subtotal. */
    const tax = Math.floor(subtotal * NEPAL_VAT_RATE);
    const totalAmount = subtotal + tax;

    /* Hand persistence to Inngest so the write happens exactly once, off-request. */
    await inngest.send({
      name: "order/created",
      data: {
        userId,
        addressId: address,
        products: orderProducts,
        totalAmount,
        date: Date.now(),
      },
    });

    /* Clear the user's cart now that the order has been queued. */
    await User.findByIdAndUpdate(userId, { cartItems: {} });

    return NextResponse.json(
      { success: true, message: "Order placed successfully" },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
