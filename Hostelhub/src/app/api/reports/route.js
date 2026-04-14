import { getDashboardStats } from "@/lib/firestore";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/reports - Fetch comprehensive report data scoped to active hostel
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const cookieStore = await cookies();
    const hostelId =
      request.headers.get("x-hostel-id") ||
      searchParams.get("hostelId") ||
      cookieStore.get("hostel-id")?.value;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const stats = await getDashboardStats(hostelId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
