import connectToDatabase from "@/config/db";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/dist/types/server";




export async function POST(req) {
    try{
        const {userId} = getAuth(req);
        const {cartData} = await req.json();
            await connectDB();
            const user = await User.findById(userId);
            if(!user) {
            return NextResponse.json({success: false, message: "User not found"}, {status: 404});
        }
        user.cartItems = cartData;
        await user.save();
        return NextResponse.json({success: true, message: "Cart updated successfully"}, {status: 200});
    }
    catch (error) {
        return NextResponse.json({success: false, message: error.message}, {status: 500});
    }
}