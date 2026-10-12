/*
 * Fill the catalog with real products and real photography.
 *
 *   npm run seed                     (assigns to the first seller account)
 *   npm run seed -- you@example.com  (assigns to a specific seller)
 *   npm run seed -- --clear          (removes seeded products, then re-seeds)
 *
 * Photos come from Unsplash (free licence, no attribution required) and are
 * uploaded into your own Cloudinary, so the catalog serves them exactly as it
 * would serve a seller's upload.
 */
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

const SEED_TAG = "seeded-catalog";

/* name, category, price (Rs.), offerPrice, stock, unsplash photo id */
const CATALOG = [
  ["Sony WH-1000XM4 Wireless Headphones", "Headphone", 44900, 38900, 12, "photo-1505740420928-5e560c06d30e",
   "Industry-leading noise cancellation with 30-hour battery life and touch controls."],
  ["Logitech Zone Wireless Headset", "Headphone", 28500, 24900, 8, "photo-1484704849700-f032a568e944",
   "Comfortable over-ear headset tuned for calls, with a noise-cancelling boom mic."],
  ["Apple AirPods Pro (2nd gen)", "Earphone", 36900, 33500, 20, "photo-1572569511254-d8f925fe2cbb",
   "Active noise cancellation, adaptive transparency and a MagSafe charging case."],
  ["Apple Watch Series 9 GPS 45mm", "Watch", 62900, 57900, 10, "photo-1546868871-7041f2a55e12",
   "Always-on Retina display, ECG, blood oxygen sensing and crash detection."],
  ["Withings ScanWatch Light", "Watch", 31900, 28900, 14, "photo-1523275335684-37898b6baf30",
   "Hybrid analogue smartwatch with 30-day battery and continuous heart tracking."],
  ["Apple iPhone 11 Pro 256GB", "Smartphone", 104900, 94900, 6, "photo-1574944985070-8f3ebc6b79d2",
   "Triple 12MP camera system, Super Retina XDR display and A13 Bionic chip."],
  ["Apple iPhone X 64GB", "Smartphone", 59900, 52900, 9, "photo-1511707171634-5f897ff02aa9",
   "5.8-inch Super Retina display with Face ID and dual 12MP cameras."],
  ["Apple MacBook Pro 14-inch M3", "Laptop", 289000, 269000, 5, "photo-1517336714731-489689fd1ca8",
   "M3 chip, Liquid Retina XDR display and up to 18 hours of battery life."],
  ["Dell Inspiron 15 Core i7", "Laptop", 134900, 119900, 11, "photo-1588872657578-7efd1f1555ed",
   "15.6-inch FHD laptop with 13th-gen Core i7, 16GB RAM and a 512GB SSD."],
  ["Apple iPad Pro 11-inch", "Laptop", 149900, 139900, 7, "photo-1542751110-97427bbecf20",
   "Liquid Retina display with ProMotion, Apple Pencil support and USB-C."],
  ["Polaroid Now+ Instant Camera", "Camera", 24900, 21900, 15, "photo-1526170375885-4d8ecf77b99f",
   "Instant film camera with autofocus, double exposure and app-controlled modes."],
  ["Canon EOS Camera Kit", "Camera", 189000, 174900, 4, "photo-1468495244123-6c6c332eeece",
   "DSLR body with two lenses, a carry strap and a spare battery."],
  ["Logitech MX Wireless Mouse", "Accessories", 9900, 8400, 30, "photo-1527864550417-7fd91fc51a46",
   "Silent, ergonomic wireless mouse with a 12-month battery and USB receiver."],
  ["JBL Flip Bluetooth Speaker", "Accessories", 18900, 16400, 18, "photo-1545454675-3531b543be5d",
   "Portable waterproof speaker with 12 hours of playback and deep bass."],
];

const [, , ...args] = process.argv;
const clear = args.includes("--clear");
const sellerEmail = args.find((a) => !a.startsWith("--"));

for (const key of ["MONGODB_URI", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) {
  if (!process.env[key]) {
    console.error(`${key} is not set in .env`);
    process.exit(1);
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const seller = sellerEmail
  ? await db.collection("users").findOne({ email: sellerEmail.toLowerCase() })
  : await db.collection("users").findOne({ role: { $in: ["seller", "admin"] } });

if (!seller) {
  console.error(`
No seller account found. Register one, then:
  npm run role -- you@example.com seller
`);
  await mongoose.disconnect();
  process.exit(1);
}

if (!["seller", "admin"].includes(seller.role)) {
  console.error(`\n${seller.email} is "${seller.role}", not a seller. Run:\n  npm run role -- ${seller.email} seller\n`);
  await mongoose.disconnect();
  process.exit(1);
}

const sellerId = String(seller._id);
console.log(`\nSeeding catalog for ${seller.email}\n`);

if (clear) {
  const old = await db.collection("products").find({ seedTag: SEED_TAG }).toArray();

  for (const product of old) {
    for (const url of product.image || []) {
      const publicId = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i)?.[1];
      if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {});
    }
  }

  const removed = await db.collection("products").deleteMany({ seedTag: SEED_TAG });
  console.log(`  cleared ${removed.deletedCount} seeded products\n`);
}

let added = 0;
let skipped = 0;

for (const [name, category, price, offerPrice, stock, photoId, description] of CATALOG) {
  /* Re-running must not create a second copy of the same product. */
  if (await db.collection("products").findOne({ name, sellerId })) {
    console.log(`  skip    ${name} (already in catalog)`);
    skipped += 1;
    continue;
  }

  const response = await fetch(`https://images.unsplash.com/${photoId}?w=900&h=900&fit=crop&q=80`);

  if (!response.ok) {
    console.log(`  FAIL    ${name} (photo download ${response.status})`);
    continue;
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  const upload = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder: "ns-gadget-hub/products" },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });

  await db.collection("products").insertOne({
    userId: sellerId,
    sellerId,
    name,
    description,
    category,
    price,
    offerPrice,
    stock,
    image: [upload.secure_url],
    date: Date.now(),
    seedTag: SEED_TAG,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`  added   ${name}`);
  added += 1;
}

const total = await db.collection("products").countDocuments();
console.log(`\n  ${added} added, ${skipped} skipped. Catalog now holds ${total} products.\n`);

await mongoose.disconnect();
