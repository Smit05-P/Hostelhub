import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Visitor from "@/models/Visitor";

export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId query parameter is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const visitors = await Visitor.find({ studentId: studentId })
      .sort({ checkInTime: -1 });

    return NextResponse.json(visitors);
  } catch (error) {
    console.error("GET /api/student-visitors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student visitors" },
      { status: 500 }
    );
  }
}
