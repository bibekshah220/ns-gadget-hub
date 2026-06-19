import connectToDatabase from "@/config/db";
import { getAuth } from "@clerk/nextjs/dist/types/server";
import { NextResponse } from "next/server";

/**
 * GET request to get the cart items for a user
 * @param {Request} req - The request object
 * @returns {NextResponse}
 * @returns {Promise<NextResponse>}
 */

export async function GET(req) {
    try{
        const {userId} = getAuth(req);
        await connectToDatabase();
        const user = await User.findById(userId);

        return NextResponse.json({success: true, cartItems}, {status: 200});
    }
    catch (error) {
        return NextResponse.json({success: false, message: error.message}, {status: 500});
    }
}