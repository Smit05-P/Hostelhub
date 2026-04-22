import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { hostelService } from "@/services/hostelService";

// GET /api/reports - Fetch comprehensive report data scoped to active hostel
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hostelId = session.hostelId || searchParams.get("hostelId");

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const stats = await hostelService.getDashboardStats(hostelId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
