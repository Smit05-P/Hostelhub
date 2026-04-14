import { getHostelsWithStats, createHostel } from "@/lib/firestore";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");
    
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized. Admin ID is required." }, { status: 401 });
    }
    
    // In production, we should verify the adminId against the authenticated user session.
    const hostels = await getHostelsWithStats(adminId);
    return NextResponse.json(hostels, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/hostels error:", error);
    return NextResponse.json({ error: "Failed to fetch hostels." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.hostelName || !data.ownerName) {
      return NextResponse.json({ error: "Hostel Name and Owner Name are required." }, { status: 400 });
    }
    // adminId should be passed from the client
    const id = await createHostel(data);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("POST /api/hostels error:", error);
    return NextResponse.json({ error: "Failed to create hostel." }, { status: 500 });
  }
}
