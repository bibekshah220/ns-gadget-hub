import { NextResponse } from "next/server";
import connectToDatabase from "@/config/db";
import Address from "@/models/address";
import { requireAuth } from "@/lib/auth";
import { cleanString } from "@/lib/validate";

const MAX_ADDRESSES_PER_USER = 20;

export async function POST(req) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const address = {
      fullName: cleanString(body.fullName, 80),
      phoneNumber: cleanString(body.phoneNumber, 20),
      pinCode: cleanString(body.pinCode, 12),
      area: cleanString(body.area, 200),
      city: cleanString(body.city, 60),
      state: cleanString(body.state, 60),
    };

    if (Object.values(address).some((value) => !value)) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!/^[0-9+\-\s]{7,20}$/.test(address.phoneNumber)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid phone number" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const userId = String(user._id);

    if ((await Address.countDocuments({ userId })) >= MAX_ADDRESSES_PER_USER) {
      return NextResponse.json(
        { success: false, message: "Address limit reached" },
        { status: 409 },
      );
    }

    await Address.create({ userId, ...address });

    return NextResponse.json(
      { success: true, message: "Address added successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Add address error:", error);
    return NextResponse.json(
      { success: false, message: "Could not save the address" },
      { status: 500 },
    );
  }
}
