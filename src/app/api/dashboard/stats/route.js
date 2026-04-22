import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { hostelService } from "@/services/server/hostelService";

// GET /api/dashboard/stats - Single aggregated endpoint for dashboard KPIs
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
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json({ error: "Backend Error: Failed to retrieve dashboard stats." }, { status: 500 });
  }
}
