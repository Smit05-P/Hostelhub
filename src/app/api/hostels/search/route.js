import { NextResponse } from "next/server";
import { hostelService } from "@/services/server/hostelService";

/**
 * GET /api/hostels/search
 * Search for hostels by name or address
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryStr = searchParams.get("query");

    if (!queryStr || queryStr.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const rawHostels = await hostelService.searchHostels(queryStr);

    // Map raw documents to the shape the client expects
    const hostels = rawHostels.map((h) => ({
      _id: h._id.toString(),
      hostelName: h.name,
      address: h.address || "Address not provided",
    }));

    return NextResponse.json(
      { success: true, hostels },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/hostels/search error:", error);
    return NextResponse.json(
      { error: "Failed to search hostels" },
      { status: 500 }
    );
  }
}
