import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/config/db";
import Address from "@/models/address";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const {
      fullName,
      phoneNumber,
      pinCode,
      area,
      city,
      state,
    } = await req.json();

    if (
      !fullName ||
      !phoneNumber ||
      !pinCode ||
      !area ||
      !city ||
      !state
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const newAddress = new Address({
      userId,
      fullName,
      phoneNumber,
      pinCode,
      area,
      city,
      state,
    });

    await newAddress.save();

    return NextResponse.json(
      { success: true, message: "Address added successfully" },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

