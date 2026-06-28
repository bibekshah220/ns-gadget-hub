import mongoose from "mongoose";

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

const productSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ALLOWED_CATEGORIES,
        },
        price: {
            type: Number,
            required: true,
        },
        offerPrice: {
            type: Number,
            required: true,
        },
        stock: {
            type: Number,
            required: true,
        },
        image: {
            type: [String],
            required: true,
        },
        sellerId: {
            type: String,
            required: true,
        },
        date: {
            type: Number,
            required: true,
            default: Date.now,
        },
    },
    { timestamps: true },
);

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;