import { getAuth } from "@clerk/nextjs/server";
import { request } from "node:http";

export async function GET() {
    try{

const {userId} = getAuth(request)
const isSeller = authSeller(userId)




    }catch(error){
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}