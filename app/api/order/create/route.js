import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import Product from "@/models/product";
import User from "@/models/User";
import { inngest } from "@/config/inngest";
import mongoose from "mongoose";
import crypto from "crypto";
import Stripe from "stripe";

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

    const { address, items, paymentMethod = "COD" } = await req.json();

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

    /* Generate an explicit ObjectId so we can track the payment before DB insert. */
    const orderId = new mongoose.Types.ObjectId();
    const orderIdStr = orderId.toString();

    let payment_url = null;
    let esewa_data = null;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get("origin") || "http://localhost:3000");

    if (paymentMethod === "Stripe") {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      
      const line_items = orderProducts.map(item => {
        const product = productMap.get(item.productId);
        return {
          price_data: {
            currency: 'usd', 
            product_data: {
              name: product.name || "Product",
            },
            unit_amount: product.offerPrice * 100, 
          },
          quantity: item.quantity,
        };
      });

      if (tax > 0) {
        line_items.push({
          price_data: {
            currency: 'usd',
            product_data: { name: 'VAT (13%)' },
            unit_amount: tax * 100,
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: line_items,
        mode: 'payment',
        success_url: `${APP_URL}/api/payment/stripe/verify?session_id={CHECKOUT_SESSION_ID}&order_id=${orderIdStr}`,
        cancel_url: `${APP_URL}/payment/failure`,
      });

      payment_url = session.url;
    } else if (paymentMethod === "Khalti") {
      const payload = {
        return_url: `${APP_URL}/api/payment/khalti/verify`,
        website_url: APP_URL,
        amount: totalAmount * 100, // Khalti needs amount in paisa
        purchase_order_id: orderIdStr,
        purchase_order_name: `Order ${orderIdStr}`,
        customer_info: {
          name: "Customer", // Ideally fetch from user details
          email: "test@khalti.com",
          phone: "9800000000"
        }
      };

      const response = await fetch("https://a.khalti.com/api/v2/epayment/initiate/", {
        method: "POST",
        headers: {
          "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const khaltiData = await response.json();
      if (khaltiData.payment_url) {
        payment_url = khaltiData.payment_url;
      } else {
        return NextResponse.json({ success: false, message: "Failed to initiate Khalti payment", error: khaltiData }, { status: 400 });
      }
    } else if (paymentMethod === "eSewa") {
      const merchantCode = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
      const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
      const message = `total_amount=${totalAmount},transaction_uuid=${orderIdStr},product_code=${merchantCode}`;
      const hash = crypto.createHmac("sha256", secretKey).update(message).digest("base64");
      
      esewa_data = {
        url: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
        params: {
          amount: totalAmount,
          tax_amount: "0",
          total_amount: totalAmount,
          transaction_uuid: orderIdStr,
          product_code: merchantCode,
          product_service_charge: "0",
          product_delivery_charge: "0",
          success_url: `${APP_URL}/api/payment/esewa/verify`,
          failure_url: `${APP_URL}/payment/failure`,
          signed_field_names: "total_amount,transaction_uuid,product_code",
          signature: hash
        }
      };
    }

    /* Hand persistence to Inngest so the write happens exactly once, off-request. */
    await inngest.send({
      name: "order/created",
      data: {
        _id: orderIdStr,
        userId,
        addressId: address,
        products: orderProducts,
        totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "Pending" : "Pending",
        date: Date.now(),
      },
    });

    /* Clear the user's cart now that the order has been queued. */
    await User.findByIdAndUpdate(userId, { cartItems: {} });

    return NextResponse.json(
      { success: true, message: "Order placed successfully", payment_url, esewa_data },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
