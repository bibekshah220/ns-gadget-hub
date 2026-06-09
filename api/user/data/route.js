export async function GET(request) {
    try{
const {userId} = getAuth(request);
await connectDB();
const user = await User.findById(userId);
if (!user) {
    return NextResponse.json({success: false, message: "User not found"}, {status: 404});
}
return NextResponse.json({success:true, user}, {status: 200});

    }catch (error) {
        return NextResponse.json({success: false, message: "Unauthorized"}, {status: 401});
    }
}