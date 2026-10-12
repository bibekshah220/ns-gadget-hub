import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    imageUrl: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },
    /* Bumped on password reset so every previously issued JWT stops validating. */
    tokenVersion: {
      type: Number,
      default: 0,
    },
    /* Only the SHA-256 hash of the reset token is stored, never the token itself. */
    resetTokenHash: {
      type: String,
      select: false,
    },
    resetTokenExpires: {
      type: Date,
      select: false,
    },
    cartItems: {
      type: Object,
      default: {},
    },
  },
  { minimize: false, timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
