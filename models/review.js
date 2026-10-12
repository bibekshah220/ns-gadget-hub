import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 2000 },
    /* True when the reviewer actually ordered this product. */
    verified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
