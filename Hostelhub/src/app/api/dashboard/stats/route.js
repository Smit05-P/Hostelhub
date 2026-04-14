import { getDashboardStats } from "@/lib/firestore";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/dashboard/stats — Single aggregated endpoint for dashboard KPIs
// Returns: totalStudents, totalRooms, occupiedRooms, availableRooms, occupancyPct,
//          pendingComplaints, totalRevenue, chartData (last 6 months)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cookieStore = await cookies();
    
    // Prioritize header (injected by middleware) -> searchParam -> cookie
    const hostelId = 
      request.headers.get("x-hostel-id") || 
      searchParams.get("hostelId") || 
      cookieStore.get("hostel-id")?.value;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const stats = await getDashboardStats(hostelId);
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    const message = error.code === "permission-denied" 
      ? "Security Protocol Violation: Access denied by cloud rules." 
      : "Synchronization Failure: Ensure valid composite indexing for scoped queries.";
    return NextResponse.json({ error: message, detail: error.message }, { status: 500 });
  }
}
