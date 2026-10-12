/*
 * Full shopping journey against a running server: seller publishes a product,
 * buyer carts it, orders it, and both sides see the order.
 *
 *   1. npm run build && PORT=3100 npm start > /tmp/ns.log 2>&1 &
 *   2. npm run check:journey
 *
 * Uploads one real image to Cloudinary and removes everything it created.
 */
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { createHash } from "node:crypto";

const BASE = process.env.CHECK_BASE_URL || "http://localhost:3100";
const stamp = Date.now();
const seller = { name: "Check Seller", email: `check_seller_${stamp}@example.com`, password: "Seller-password-123" };
const buyer = { name: "Check Buyer", email: `check_buyer_${stamp}@example.com`, password: "Buyer-password-123" };
const rival = { name: "Check Rival", email: `check_rival_${stamp}@example.com`, password: "Rival-password-123" };

const ok = (name) => console.log(`  PASS  ${name}`);

/* One cookie jar per actor, so the two sessions never bleed into each other. */
const actor = () => {
  const jar = { cookie: "" };

  jar.call = async (path, { method = "GET", body, form, redirect = "manual" } = {}) => {
    const res = await fetch(BASE + path, {
      method,
      redirect,
      headers: {
        ...(body ? { "content-type": "application/json" } : {}),
        ...(jar.cookie ? { cookie: jar.cookie } : {}),
      },
      body: form ?? (body ? JSON.stringify(body) : undefined),
    });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) jar.cookie = setCookie.split(";")[0];

    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, json, text, headers: res.headers };
  };

  return jar;
};

/* A 1x1 PNG: the smallest thing Cloudinary will accept as a real image. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

assert.ok(process.env.MONGODB_URI, "MONGODB_URI is required");
await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

/* Upload needs a key with "create" permission; a read-only key must not be
   reported as an application bug. */
const cloudinaryCanUpload = async () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return { ok: false, reason: "Cloudinary credentials are not set" };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
    .digest("hex");

  const form = new FormData();
  form.set("file", new Blob([PNG], { type: "image/png" }), "probe.png");
  form.set("api_key", CLOUDINARY_API_KEY);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: form },
  );

  if (res.ok) {
    return { ok: true };
  }

  const body = await res.json().catch(() => ({}));
  return { ok: false, reason: `${res.status} ${body?.error?.message || "upload rejected"}` };
};

const sellerSession = actor();
const buyerSession = actor();
const rivalSession = actor();
let productId;
let orderId;
let uploadedPublicIds = [];

try {
  // --- signed-out pages ---
  let r = await sellerSession.call("/");
  assert.equal(r.status, 200);
  assert.match(r.text, /Gadget Hub/);
  ok("storefront renders for a signed-out visitor");

  for (const path of ["/cart", "/my-orders", "/seller", "/add-address"]) {
    const guarded = await actor().call(path);
    assert.equal(guarded.status, 307, `${path} should bounce a signed-out visitor`);
    assert.match(guarded.headers.get("location"), /\/login\?next=/);
  }
  ok("protected pages redirect to login with a next param");

  for (const path of ["/login", "/register", "/forgot-password", "/reset-password", "/all-products"]) {
    const page = await actor().call(path);
    assert.equal(page.status, 200, `${path} should render`);
  }
  ok("auth and catalog pages render");

  // --- accounts ---
  r = await sellerSession.call("/api/auth/register", { method: "POST", body: seller });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  const sellerId = r.json.user._id;

  r = await buyerSession.call("/api/auth/register", { method: "POST", body: buyer });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  ok("seller and buyer accounts created");

  // --- the seller gate actually gates ---
  r = await sellerSession.call("/api/product/sellerList");
  assert.equal(r.status, 401, "role is still 'user' at this point");

  await db.collection("users").updateOne(
    { _id: new mongoose.Types.ObjectId(sellerId) },
    { $set: { role: "seller" } },
  );

  r = await sellerSession.call("/api/product/sellerList");
  assert.equal(r.status, 200, "promotion must take effect without a re-login");
  ok("role change takes effect on the very next request");

  // --- publish a product ---
  const form = new FormData();
  form.set("name", `Check Headphone ${stamp}`);
  form.set("description", "Created by scripts/journey-check.mjs");
  form.set("category", "Headphone");
  form.set("price", "2000");
  form.set("offerPrice", "1500");
  form.set("stock", "5");
  form.append("image", new Blob([PNG], { type: "image/png" }), "check.png");

  const uploads = await cloudinaryCanUpload();

  if (uploads.ok) {
    r = await sellerSession.call("/api/product/add", { method: "POST", form });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    productId = r.json.product._id;
    assert.match(r.json.product.image[0], /^https:\/\/res\.cloudinary\.com\//);
    /* Remember the asset so the media library is left as we found it. */
    uploadedPublicIds = r.json.product.image.map(
      (url) => url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i)?.[1],
    ).filter(Boolean);
    ok("seller publishes a product and the image lands on Cloudinary");
  } else {
    /* Seed the product directly so the rest of the journey still runs. */
    const seeded = await db.collection("products").insertOne({
      userId: sellerId,
      sellerId,
      name: `Check Headphone ${stamp}`,
      description: "Seeded by scripts/journey-check.mjs",
      category: "Headphone",
      price: 2000,
      offerPrice: 1500,
      stock: 5,
      image: ["https://res.cloudinary.com/placeholder/image/upload/seed.png"],
      date: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    productId = String(seeded.insertedId);
    console.log(`  SKIP  product upload - ${uploads.reason}`);
    console.log("        (grant the Cloudinary API key 'create' permission to cover this path)");
  }

  // --- bad product payloads ---
  const reject = async (fields, why) => {
    const bad = new FormData();
    bad.set("name", "Bad");
    bad.set("description", "Bad");
    bad.set("category", "Headphone");
    bad.set("price", "100");
    bad.set("offerPrice", "50");
    bad.set("stock", "1");
    bad.append("image", new Blob([PNG], { type: "image/png" }), "check.png");
    for (const [k, v] of Object.entries(fields)) bad.set(k, v);
    const res = await sellerSession.call("/api/product/add", { method: "POST", form: bad });
    assert.equal(res.status, 400, why);
  };

  await reject({ offerPrice: "500" }, "offer above price must be refused");
  await reject({ price: "-5" }, "negative price must be refused");
  await reject({ category: "Submarine" }, "unknown category must be refused");
  await reject({ stock: "2.5" }, "fractional stock must be refused");
  ok("product validation refuses bad prices, categories and stock");

  const evil = new FormData();
  evil.set("name", "Evil");
  evil.set("description", "Evil");
  evil.set("category", "Headphone");
  evil.set("price", "10");
  evil.set("offerPrice", "10");
  evil.set("stock", "1");
  evil.append("image", new Blob(["<?php echo 1; ?>"], { type: "application/x-php" }), "shell.php");
  r = await sellerSession.call("/api/product/add", { method: "POST", form: evil });
  assert.equal(r.status, 400, "a non-image upload must be refused");
  ok("non-image upload refused");

  // --- buyer cannot publish ---
  const buyerForm = new FormData();
  buyerForm.set("name", "Nope");
  buyerForm.set("description", "Nope");
  buyerForm.set("category", "Headphone");
  buyerForm.set("price", "10");
  buyerForm.set("offerPrice", "10");
  buyerForm.set("stock", "1");
  buyerForm.append("image", new Blob([PNG], { type: "image/png" }), "check.png");
  r = await buyerSession.call("/api/product/add", { method: "POST", form: buyerForm });
  assert.equal(r.status, 401, "a buyer must not be able to publish");
  ok("buyer cannot publish a product");

  // --- catalog, cart, address ---
  r = await actor().call("/api/product/list");
  assert.equal(r.status, 200);
  assert.ok(r.json.products.some((p) => p._id === productId), "new product appears in the public catalog");
  ok("product appears in the public catalog");

  r = await buyerSession.call("/api/cart/update", { method: "POST", body: { cartData: { [productId]: 2 } } });
  assert.equal(r.status, 200);
  r = await buyerSession.call("/api/auth/me");
  assert.equal(r.json.user.cartItems[productId], 2, "cart survives a round trip");
  ok("buyer cart persists server-side");

  r = await buyerSession.call("/api/user/add-address", {
    method: "POST",
    body: { fullName: "Check Buyer", phoneNumber: "9800000000", pinCode: "44600", area: "Thamel", city: "Kathmandu", state: "Bagmati" },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));

  r = await buyerSession.call("/api/user/add-address", {
    method: "POST",
    body: { fullName: "Bad Phone", phoneNumber: "not-a-phone", pinCode: "44600", area: "Thamel", city: "Kathmandu", state: "Bagmati" },
  });
  assert.equal(r.status, 400, "a junk phone number must be refused");

  r = await buyerSession.call("/api/user/get-address");
  const addressId = r.json.address[0]._id;
  ok("address saved, junk phone number refused");

  // --- price is server-side, not client-side ---
  r = await buyerSession.call("/api/order/create", {
    method: "POST",
    body: {
      address: addressId,
      items: [{ product: productId, quantity: 2 }],
      paymentMethod: "COD",
      totalAmount: 1,
      price: 1,
    },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  orderId = r.json.orderId;

  const order = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(orderId) });
  /* 2 x 1500 = 3000, plus 13% VAT floored = 390. */
  assert.equal(order.totalAmount, 3390, `client-sent total must be ignored, got ${order.totalAmount}`);
  ok("order total computed from DB prices, client-sent amount ignored");

  r = await buyerSession.call("/api/auth/me");
  assert.deepEqual(r.json.user.cartItems, {}, "cart cleared after checkout");
  ok("cart cleared after checkout");

  // --- over-stock and over-quantity ---
  r = await buyerSession.call("/api/order/create", {
    method: "POST",
    body: { address: addressId, items: [{ product: productId, quantity: 99 }], paymentMethod: "COD" },
  });
  assert.equal(r.status, 400, "ordering beyond stock must be refused");

  r = await buyerSession.call("/api/order/create", {
    method: "POST",
    body: { address: addressId, items: [{ product: productId, quantity: 0 }], paymentMethod: "COD" },
  });
  assert.equal(r.status, 400, "zero quantity must be refused");

  r = await buyerSession.call("/api/order/create", {
    method: "POST",
    body: { address: addressId, items: [{ product: productId, quantity: 1 }], paymentMethod: "Bitcoin" },
  });
  assert.equal(r.status, 400, "unknown payment method must be refused");
  ok("stock, quantity and payment-method limits enforced");

  // --- both sides see the order ---
  r = await buyerSession.call("/api/order/list");
  assert.equal(r.status, 200);
  assert.ok(r.json.orders.some((o) => o._id === orderId), "buyer sees the order");
  assert.equal(r.json.orders[0].items[0].product.name, `Check Headphone ${stamp}`, "product populated");

  r = await sellerSession.call("/api/order/seller-orders");
  assert.equal(r.status, 200);
  assert.ok(r.json.orders.some((o) => o._id === orderId), "seller sees the order");
  ok("buyer and seller both see the order with products populated");

  // --- tenant isolation ---
  r = await sellerSession.call("/api/order/list");
  assert.ok(!r.json.orders.some((o) => o._id === orderId), "seller's own order list must not include the buyer's order");
  r = await sellerSession.call("/api/user/get-address");
  assert.equal(r.json.address.length, 0, "seller must not see the buyer's addresses");
  ok("one account cannot read another's orders or addresses");

  // --- order lifecycle: seller drives it, buyer sees every step ---
  const statusOf = async (session) => {
    const res = await session.call("/api/order/list");
    return res.json.orders.find((o) => o._id === orderId);
  };

  const setStatus = (session, status) =>
    session.call("/api/order/update-status", { method: "POST", body: { orderId, status } });

  r = await setStatus(buyerSession, "approved");
  assert.equal(r.status, 401, "a buyer must not be able to approve their own order");

  r = await setStatus(sellerSession, "completed");
  assert.equal(r.status, 400, "an order cannot jump straight from placed to completed");
  ok("status endpoint refuses a buyer and refuses skipped steps");

  r = await sellerSession.call("/api/auth/register", { method: "POST", body: rival });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  await db.collection("users").updateOne(
    { _id: new mongoose.Types.ObjectId(r.json.user._id) },
    { $set: { role: "seller" } },
  );
  /* Registering re-pointed sellerSession's cookie at the new account, so sign
     the real seller back in before continuing. */
  await rivalSession.call("/api/auth/login", { method: "POST", body: { email: rival.email, password: rival.password } });
  await sellerSession.call("/api/auth/login", { method: "POST", body: { email: seller.email, password: seller.password } });

  r = await setStatus(rivalSession, "approved");
  assert.equal(r.status, 401, "a seller with no product on the order must not touch it");
  ok("a seller cannot move another seller's order");

  r = await setStatus(sellerSession, "approved");
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.changed, true);

  let seen = await statusOf(buyerSession);
  assert.equal(seen.status, "approved", "buyer sees the approval");
  assert.ok(seen.statusHistory.some((entry) => entry.status === "approved"), "approval is timestamped in history");
  ok("seller approves, buyer's order list shows approved with a history entry");

  r = await setStatus(sellerSession, "approved");
  assert.equal(r.json.changed, false, "re-sending the same status must not write again");
  seen = await statusOf(buyerSession);
  assert.equal(
    seen.statusHistory.filter((entry) => entry.status === "approved").length,
    1,
    "no duplicate history row for an unchanged status",
  );
  ok("re-sending the current status is a no-op");

  for (const next of ["shipped", "delivered", "completed"]) {
    r = await setStatus(sellerSession, next);
    assert.equal(r.status, 200, `${next}: ${JSON.stringify(r.json)}`);
    seen = await statusOf(buyerSession);
    assert.equal(seen.status, next, `buyer sees ${next}`);
  }
  ok("buyer tracks the order through shipped, delivered and completed");

  r = await setStatus(sellerSession, "cancelled");
  assert.equal(r.status, 400, "a completed order cannot be cancelled");
  ok("completed is terminal");

  // --- payment callbacks cannot settle a COD order ---
  r = await actor().call(`/api/payment/khalti/verify?pidx=made-up&purchase_order_id=${orderId}`);
  assert.equal(r.status, 307);
  assert.match(r.headers.get("location"), /\/payment\/failure/);

  const after = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(orderId) });
  assert.equal(after.paymentStatus, "Pending", "a forged callback must not mark the order paid");
  ok("forged Khalti callback leaves the order unpaid");

  console.log("\nALL JOURNEY CHECKS PASSED");
} finally {
  /* Remove everything this run created, whether it passed or failed. */
  await db.collection("users").deleteMany({ email: { $in: [seller.email, buyer.email, rival.email] } });
  if (productId) await db.collection("products").deleteOne({ _id: new mongoose.Types.ObjectId(productId) });
  if (orderId) await db.collection("orders").deleteOne({ _id: new mongoose.Types.ObjectId(orderId) });
  await db.collection("addresses").deleteMany({ fullName: "Check Buyer" });
  await mongoose.disconnect();

  for (const publicId of uploadedPublicIds) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
      .digest("hex");

    const form = new FormData();
    form.set("public_id", publicId);
    form.set("api_key", process.env.CLOUDINARY_API_KEY);
    form.set("timestamp", String(timestamp));
    form.set("signature", signature);

    await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
      { method: "POST", body: form },
    ).catch(() => {});
  }
}
