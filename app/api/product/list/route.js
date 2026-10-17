import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/product";

/* The catalog is read on nearly every page view, so it is projected and lean:
   returning whole hydrated documents for the entire collection is a cliff the
   moment the catalog stops being small. */
const LIST_FIELDS = "name description category price offerPrice stock image date ratingAverage ratingCount";

export async function GET() {
    try {
        await connectDB();

        const products = await Product.find()
            .select(LIST_FIELDS)
            .sort({ date: -1 })
            .lean();

        return NextResponse.json({ success: true, products }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
