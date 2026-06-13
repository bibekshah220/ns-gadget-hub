import { getAuth } from "@clerk/nextjs/server";
import { request } from "node:http";

export async function GET() {
    try{

const {userId} = getAuth(request)
const isSeller = authSeller(userId)

if(!isSeller){
    return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
}






    }catch(error){
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}