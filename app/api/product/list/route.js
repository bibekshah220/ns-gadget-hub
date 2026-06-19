import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/product";

export async function GET() {
    try {
        await connectDB();

        const products = await Product.find().sort({ date: -1 });

        return NextResponse.json({ success: true, products }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
