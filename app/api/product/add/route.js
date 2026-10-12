import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import connectToDatabase from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/product";
import { requireAuth } from "@/lib/auth";
import { cleanString } from "@/lib/validate";

const ALLOWED_CATEGORIES = [
  "Earphone",
  "Headphone",
  "Watch",
  "Smartphone",
  "Laptop",
  "Camera",
  "Accessories",
  "Full Stack",
  "Backend",
  "Frontend",
];

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_PRICE = 10_000_000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const badRequest = (message, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

/* Money-ish numbers only: finite, non-negative, within a sane ceiling. */
const parseAmount = (value) => {
  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0 && amount <= MAX_PRICE ? amount : null;
};

export async function POST(req) {
  try {
    const user = await requireAuth(req);

    if (!authSeller(user)) {
      return badRequest("Unauthorized", 401);
    }

    const formData = await req.formData();

    const name = cleanString(formData.get("name"), 140);
    const description = cleanString(formData.get("description"), 5000);
    const category = cleanString(formData.get("category"), 40);
    const price = parseAmount(formData.get("price"));
    const offerPrice = parseAmount(formData.get("offerPrice"));
    const stock = Number(formData.get("stock"));
    const files = formData.getAll("image").filter((file) => file && file.size > 0);

    if (!name || !description || !category) {
      return badRequest("Missing required fields");
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return badRequest("Invalid category");
    }

    if (price === null || offerPrice === null) {
      return badRequest("Price and offer price must be valid amounts");
    }

    if (offerPrice > price) {
      return badRequest("Offer price cannot be higher than the price");
    }

    if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) {
      return badRequest("Stock must be a whole number");
    }

    if (files.length === 0) {
      return badRequest("At least one image is required");
    }

    if (files.length > MAX_IMAGES) {
      return badRequest(`At most ${MAX_IMAGES} images are allowed`);
    }

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return badRequest("Only JPEG, PNG, WebP and GIF images are allowed");
      }

      if (file.size > MAX_IMAGE_BYTES) {
        return badRequest("Each image must be 5MB or smaller");
      }
    }

    /* resource_type "image" (not "auto") so a renamed script cannot be stored. */
    let uploads;

    try {
      uploads = await Promise.all(
        files.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());

          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: "image", folder: "ns-gadget-hub/products" },
              (error, result) => (error ? reject(error) : resolve(result.secure_url)),
            );
            stream.end(buffer);
          });
        }),
      );
    } catch (uploadError) {
      /* A rejected upload is almost always a credentials problem, not a bad
         file. Say so instead of returning a bare 500. */
      console.error("Cloudinary upload failed:", uploadError?.message || uploadError);

      if (uploadError?.http_code === 401 || uploadError?.http_code === 403) {
        console.error(
          "Cloudinary rejected the API key. Run: npm run check:cloudinary",
        );
        return badRequest(
          "Image upload is not configured correctly. Check the Cloudinary API key permissions.",
          503,
        );
      }

      return badRequest("Could not upload the product images", 502);
    }

    await connectToDatabase();

    const sellerId = String(user._id);
    const newProduct = await Product.create({
      userId: sellerId,
      sellerId,
      name,
      description,
      category,
      price,
      offerPrice,
      stock,
      image: uploads,
      date: Date.now(),
    });

    return NextResponse.json(
      { success: true, message: "Product added successfully", product: newProduct },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add product" },
      { status: 500 },
    );
  }
}
