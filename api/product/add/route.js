import { getAuth } from "@clerk/nextjs/server";
import {v2 as cloudinary} from "cloudinary";

/**
 * configure cloudinary 
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
try{

    const {userId} = getAuth(req);

    const isSeller = await authSeller(userId);

    if(!isSeller) {
        return NextResponse.json({success: false, message: "Unauthorized"}, {status: 401});
    }

    const formData = await req.formData();

    const name = formData.get("name");
    const description = formData.get("description");
    const category = formData.get("category");  
    const price = formData.get("price");
    const offerPrice = formData.get("offerPrice");
    const stock = formData.get("stock");
    const file = formData.get("image");

    if(!file || file.length === 0) {
        return NextResponse.json({success: false, message: "Image is required"}, {status: 400});
    }  
    
    

}catch (error){
   console.error(error);  
}

}
