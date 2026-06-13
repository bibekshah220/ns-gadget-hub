import { getAuth } from "@clerk/nextjs/server";

export async function GET() {
    try{

const {userId} = getAuth




    }catch(error){
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}