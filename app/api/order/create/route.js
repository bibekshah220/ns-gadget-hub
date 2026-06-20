import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import Product from "@/models/product";
import Order from "@/models/oder";

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

    /* Build order line items and compute the total from trusted DB prices. */
    const orderProducts = [];
    let totalAmount = 0;

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
      totalAmount += product.offerPrice * quantity;
    }

    const order = await Order.create({
      userId,
      addressId: address,
      products: orderProducts,
      totalAmount,
    });

    return NextResponse.json(
      { success: true, message: "Order placed successfully", order },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
