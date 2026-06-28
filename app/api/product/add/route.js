import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import connectToDatabase from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/product";

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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const formData = await req.formData();

    const name = formData.get("name");
    const description = formData.get("description");
    const category = formData.get("category");
    const price = formData.get("price");
    const offerPrice = formData.get("offerPrice");
    const stock = formData.get("stock");
    const files = formData.getAll("image");

    if (
      !name ||
      !description ||
      !category ||
      !price ||
      !offerPrice ||
      !stock
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one image is required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_CATEGORIES.includes(String(category))) {
      return NextResponse.json(
        { success: false, message: "Invalid category" },
        { status: 400 },
      );
    }

    /* Upload every image to Cloudinary and collect the secure URLs. */
    const uploads = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            },
          );
          stream.end(buffer);
        });
      }),
    );

    await connectToDatabase();

    const newProduct = await Product.create({
      userId,
      name,
      description,
      category,
      price: Number(price),
      offerPrice: Number(offerPrice),
      stock: Number(stock),
      image: uploads,
      date: Date.now(),
      sellerId: userId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product added successfully",
        product: newProduct,
      },
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
