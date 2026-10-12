import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validate";

const MAX_CART_LINES = 100;
const MAX_QUANTITY_PER_ITEM = 100;

/* The cart is stored as a free-form object, so it is sanitised key by key
   rather than trusted as sent. */
const sanitiseCart = (cartData) => {
  if (cartData === null || typeof cartData !== "object" || Array.isArray(cartData)) {
    return null;
  }

  const entries = Object.entries(cartData);

  if (entries.length > MAX_CART_LINES) {
    return null;
  }

  const clean = {};

  for (const [productId, rawQuantity] of entries) {
    if (!isValidObjectId(productId)) {
      return null;
    }

    const quantity = Number(rawQuantity);

    if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY_PER_ITEM) {
      return null;
    }

    if (quantity > 0) {
      clean[productId] = quantity;
    }
  }

  return clean;
};

export async function POST(req) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { cartData } = await req.json();
    const clean = sanitiseCart(cartData);

    if (!clean) {
      return NextResponse.json(
        { success: false, message: "Invalid cart data" },
        { status: 400 },
      );
    }

    await connectToDatabase();
    await User.updateOne({ _id: user._id }, { cartItems: clean });

    return NextResponse.json(
      { success: true, message: "Cart updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Cart update error:", error);
    return NextResponse.json(
      { success: false, message: "Could not update the cart" },
      { status: 500 },
    );
  }
}
