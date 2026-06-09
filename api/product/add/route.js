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
    
    const result = await Promise.all(
        file.map(async (file) => {
            const arryBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arryBuffer);
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {resource_type: "auto"},
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result.secure_url);
                        }
                    }
                );
                stream.end(buffer);
            });
        })
    );

    const image = result.map(result => result.secure_url)

    await connectDB();
    const newProduct = await Product.create({
        userId,
        name,   
        description,
        category,
        price: Number(price),
        offerPrice: Number(offerPrice),
        stock: Number(stock),
        image,
        date: Date.now(),
        sellerId: userId,
    });

    return NextResponse.json({success: true, message: "Product added successfully", product: newProduct}, {status: 201});

}catch (error){
   console.error(error);  
   return NextResponse.json({success: false, message: "Internal Server Error"}, {status: 500});
}

}
