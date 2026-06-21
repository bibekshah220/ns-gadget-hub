import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import Product from "@/models/product";
import Order from "@/models/oder";

/* Nepal levies 13% VAT on the order subtotal. */
const NEPAL_VAT_RATE = 0.13;

/* Compute order line items and total from trusted DB prices, not client input. */
async function calculateTotalAmount(items) {
  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(
    products.map((product) => [product._id.toString(), product]),
  );

  const orderProducts = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productMap.get(String(item.product));

    if (!product) {
      throw new Error(`Product not found: ${item.product}`);
    }

    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Invalid quantity for an item");
    }

    orderProducts.push({ productId: product._id.toString(), quantity });
    subtotal += product.offerPrice * quantity;
  }

  /* Apply Nepal VAT (13%) on top of the subtotal. */
  const tax = Math.floor(subtotal * NEPAL_VAT_RATE);
  const totalAmount = subtotal + tax;

  return { orderProducts, subtotal, tax, totalAmount };
}

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
        { success: false, message: "Address and items are required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const { orderProducts, totalAmount } = await calculateTotalAmount(items);

    const order = new Order({
      userId,
      products: orderProducts,
      totalAmount,
      addressId: address,
    });
    await order.save();

    return NextResponse.json(
      { success: true, message: "Order placed successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to place order" },
      { status: 500 },
    );
  }
}