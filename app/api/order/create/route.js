import { NextResponse } from "next/server";
import crypto from "crypto";
import Stripe from "stripe";
import connectToDatabase from "@/config/db";
import Address from "@/models/address";
import Order from "@/models/order";
import Product from "@/models/product";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { isValidObjectId } from "@/lib/validate";

/* Nepal levies 13% VAT on the order subtotal. */
const NEPAL_VAT_RATE = 0.13;
const MAX_LINE_ITEMS = 50;
const MAX_QUANTITY_PER_ITEM = 100;
const PAYMENT_METHODS = ["COD", "Khalti", "eSewa", "Stripe"];

const badRequest = (message, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

/* Hands reserved units back when an order cannot be completed. */
const releaseStock = async (reserved) => {
  if (reserved.length === 0) {
    return;
  }

  await Product.bulkWrite(
    reserved.map(({ productId, quantity }) => ({
      updateOne: { filter: { _id: productId }, update: { $inc: { stock: quantity } } },
    })),
    { ordered: false },
  );
};

export async function POST(req) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return badRequest("Unauthorized", 401);
    }

    const userId = String(user._id);
    const { address, items, paymentMethod = "COD" } = await req.json();

    if (!Array.isArray(items) || items.length === 0 || items.length > MAX_LINE_ITEMS) {
      return badRequest("Invalid order data");
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return badRequest("Unsupported payment method");
    }

    if (!isValidObjectId(address)) {
      return badRequest("Invalid delivery address");
    }

    await connectToDatabase();

    const productIds = items.map((item) => item.product);

    if (!productIds.every(isValidObjectId)) {
      return badRequest("Invalid product in cart");
    }

    /* Independent reads, so they go together rather than one after the other. */
    const [deliveryAddress, products] = await Promise.all([
      /* The address must belong to the caller, not merely exist. */
      Address.findOne({ _id: address, userId }).lean(),
      Product.find({ _id: { $in: productIds } })
        .select("name offerPrice stock")
        .lean(),
    ]);

    if (!deliveryAddress) {
      return badRequest("Invalid delivery address");
    }

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    /* Build order lines and compute the subtotal from trusted DB prices. */
    const orderProducts = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(String(item.product));

      if (!product) {
        return badRequest(`Product not found: ${item.product}`, 404);
      }

      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > MAX_QUANTITY_PER_ITEM
      ) {
        return badRequest("Invalid quantity for an item");
      }

      if (product.stock < quantity) {
        return badRequest(`Not enough stock for ${product.name}`);
      }

      orderProducts.push({ productId: product._id.toString(), quantity });
      subtotal += product.offerPrice * quantity;
    }

    /* Reserve stock before writing the order.
     *
     * The check above is advisory only: between reading a product and writing
     * the order, any number of other buyers can take the same unit. Each
     * decrement is therefore conditional on the stock still being there, and
     * whichever request loses the race is the one that gets nothing. Lines
     * already taken are returned if a later line fails, so a part-filled order
     * never holds inventory it did not sell.
     */
    const reserved = [];

    for (const line of orderProducts) {
      const taken = await Product.updateOne(
        { _id: line.productId, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } },
      );

      if (taken.modifiedCount !== 1) {
        await releaseStock(reserved);
        return badRequest(`Not enough stock for ${productMap.get(line.productId)?.name ?? "an item"}`);
      }

      reserved.push(line);
    }

    /* Apply Nepal VAT (13%) on top of the subtotal. */
    const tax = Math.floor(subtotal * NEPAL_VAT_RATE);
    const totalAmount = subtotal + tax;

    /* Persist the order before talking to any gateway, so the callback has
       something to bind its reference to. */
    const initialStatus = paymentMethod === "COD" ? "order placed" : "pending";

    let order;

    try {
      order = await Order.create({
        userId,
        addressId: String(deliveryAddress._id),
        products: orderProducts,
        totalAmount,
        paymentMethod,
        paymentStatus: "Pending",
        status: initialStatus,
        statusHistory: [{ status: initialStatus, at: new Date() }],
      });
    } catch (error) {
      await releaseStock(reserved);
      throw error;
    }

    const orderIdStr = String(order._id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let payment_url = null;
    let esewa_data = null;

    if (paymentMethod === "Stripe") {
      if (!process.env.STRIPE_SECRET_KEY) {
        await releaseStock(reserved);
        return badRequest("Stripe is not configured", 503);
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      const line_items = orderProducts.map((item) => {
        const product = productMap.get(item.productId);

        return {
          price_data: {
            currency: "npr",
            product_data: { name: product.name || "Product" },
            unit_amount: Math.round(product.offerPrice * 100),
          },
          quantity: item.quantity,
        };
      });

      if (tax > 0) {
        line_items.push({
          price_data: {
            currency: "npr",
            product_data: { name: "VAT (13%)" },
            unit_amount: Math.round(tax * 100),
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode: "payment",
        client_reference_id: orderIdStr,
        success_url: `${appUrl}/api/payment/stripe/verify?session_id={CHECKOUT_SESSION_ID}&order_id=${orderIdStr}`,
        cancel_url: `${appUrl}/payment/failure`,
      });

      order.paymentRef = session.id;
      await order.save();
      payment_url = session.url;
    } else if (paymentMethod === "Khalti") {
      if (!process.env.KHALTI_SECRET_KEY) {
        await releaseStock(reserved);
        return badRequest("Khalti is not configured", 503);
      }

      const response = await fetch("https://a.khalti.com/api/v2/epayment/initiate/", {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          return_url: `${appUrl}/api/payment/khalti/verify`,
          website_url: appUrl,
          amount: totalAmount * 100, // Khalti takes paisa
          purchase_order_id: orderIdStr,
          purchase_order_name: `Order ${orderIdStr}`,
          customer_info: {
            name: user.name,
            email: user.email,
          },
        }),
      });

      const khaltiData = await response.json();

      if (!khaltiData.pidx || !khaltiData.payment_url) {
        await releaseStock(reserved);
        return badRequest("Failed to initiate Khalti payment");
      }

      order.paymentRef = khaltiData.pidx;
      await order.save();
      payment_url = khaltiData.payment_url;
    } else if (paymentMethod === "eSewa") {
      const secretKey = process.env.ESEWA_SECRET_KEY;
      const merchantCode = process.env.ESEWA_MERCHANT_CODE;

      /* No fallback: the published test secret would let anyone sign a
         "payment complete" callback for any order. */
      if (!secretKey || !merchantCode) {
        await releaseStock(reserved);
        return badRequest("eSewa is not configured", 503);
      }

      const message = `total_amount=${totalAmount},transaction_uuid=${orderIdStr},product_code=${merchantCode}`;
      const signature = crypto
        .createHmac("sha256", secretKey)
        .update(message)
        .digest("base64");

      order.paymentRef = orderIdStr;
      await order.save();

      esewa_data = {
        url:
          process.env.ESEWA_FORM_URL ||
          "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
        params: {
          amount: totalAmount,
          tax_amount: "0",
          total_amount: totalAmount,
          transaction_uuid: orderIdStr,
          product_code: merchantCode,
          product_service_charge: "0",
          product_delivery_charge: "0",
          success_url: `${appUrl}/api/payment/esewa/verify`,
          failure_url: `${appUrl}/payment/failure`,
          signed_field_names: "total_amount,transaction_uuid,product_code",
          signature,
        },
      };
    }

    /* Clear the cart now that the order exists. */
    await User.findByIdAndUpdate(userId, { cartItems: {} });

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        orderId: orderIdStr,
        payment_url,
        esewa_data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json(
      { success: false, message: "Could not place the order" },
      { status: 500 },
    );
  }
}
