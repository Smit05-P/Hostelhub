import { getAllVisitors } from "@/lib/firestore";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId query parameter is required" }, { status: 400 });
    }

    // Forward to service layer, matching the hostStudentId schema key
    const visitors = await getAllVisitors({ hostStudentId: studentId });
    return NextResponse.json(visitors);
  } catch (error) {
    console.error("GET /api/student-visitors error:", error);
    return NextResponse.json({ error: "Failed to fetch student visitors" }, { status: 500 });
  }
}
