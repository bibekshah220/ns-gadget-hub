import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import Order from "@/models/order";
import Product from "@/models/product";
import Review from "@/models/review";
import { requireAuth } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { cleanString, isValidObjectId } from "@/lib/validate";

/* Keep the product's denormalised rating in step with its reviews. */
const refreshProductRating = async (productId) => {
  const [summary] = await Review.aggregate([
    { $match: { productId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Product.updateOne(
    { _id: productId },
    {
      ratingAvg: summary ? Math.round(summary.avg * 10) / 10 : 0,
      ratingCount: summary ? summary.count : 0,
    },
  );
};

export async function GET(req) {
  try {
    const productId = new URL(req.url).searchParams.get("productId");

    if (!isValidObjectId(productId)) {
      return NextResponse.json({ success: false, message: "Invalid product" }, { status: 400 });
    }

    await connectToDatabase();

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    /* userId is never sent to the client; the display name is enough. */
    return NextResponse.json(
      {
        success: true,
        reviews: reviews.map(({ _id, name, rating, comment, verified, createdAt }) => ({
          _id,
          name,
          rating,
          comment,
          verified,
          createdAt,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Review list error:", error);
    return NextResponse.json(
      { success: false, message: "Could not load reviews" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Sign in to leave a review" },
        { status: 401 },
      );
    }

    const limit = rateLimit(`review:${clientIp(req)}`, { limit: 10, windowMs: 60 * 60 * 1000 });

    if (!limit.ok) {
      return NextResponse.json(
        { success: false, message: "Too many reviews. Try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = await req.json();
    const productId = body.productId;
    const rating = Number(body.rating);
    const comment = cleanString(body.comment, 2000);

    if (!isValidObjectId(productId)) {
      return NextResponse.json({ success: false, message: "Invalid product" }, { status: 400 });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Choose a rating between 1 and 5 stars" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    if (!(await Product.exists({ _id: productId }))) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const userId = String(user._id);

    /* A review from someone who bought the item carries a badge. */
    const verified = Boolean(
      await Order.exists({ userId, "products.productId": productId }),
    );

    /* One review per person per product: a second submission edits the first. */
    await Review.findOneAndUpdate(
      { productId, userId },
      { name: user.name, rating, comment, verified },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await refreshProductRating(productId);

    return NextResponse.json(
      { success: true, message: "Thanks for the review." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Review create error:", error);
    return NextResponse.json(
      { success: false, message: "Could not save the review" },
      { status: 500 },
    );
  }
}
