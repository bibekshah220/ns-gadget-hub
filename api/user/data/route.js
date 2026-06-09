export async function GET(request) {
    try{
const {userId} = getAuth(request);
await connectDB();

    }catch (error) {
        return new Response(JSON.stringify({error: "Unauthorized"}), {status: 401});
    }
}