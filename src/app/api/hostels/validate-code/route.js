import { NextResponse } from "next/server";
import { hostelService } from "@/services/server/hostelService";

/**
 * GET /api/hostels/validate-code
 * Validates a join code and returns basic hostel info
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const hostel = await hostelService.validateJoinCode(code);
    
    if (!hostel) {
      return NextResponse.json({ error: "Invalid join code" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      hostel: {
        id: hostel._id,
        name: hostel.name,
        address: hostel.address
      } 
    }, { status: 200 });
  } catch (error) {
    console.error("GET /api/hostels/validate-code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
