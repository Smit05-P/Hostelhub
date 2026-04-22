import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { studentService } from "@/services/server/studentService";

// GET /api/students — Fetch all students with search, filter, and pagination
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const filterRoom = searchParams.get("room_id") || "all";
    const filterStatus = searchParams.get("status") || "all";
    const filterHostelStatus = searchParams.get("hostelStatus") || "all";
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const cursor = searchParams.get("cursor") || null;
    
    // Prioritize hostelId from session (safe) over query param
    const hostelId = session.hostelId || searchParams.get("hostelId");

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const { students, nextCursor } = await studentService.getStudents({
      hostelId,
      search,
      roomId: filterRoom,
      status: filterStatus,
      hostelStatus: filterHostelStatus,
      limit: pageSize,
      cursor
    });

    return NextResponse.json({ 
      students, 
      nextCursor, 
      hasMore: !!nextCursor,
      totalCount: students.length
    });
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ error: "Backend Error: Failed to retrieve student entities." }, { status: 500 });
  }
}

// POST /api/students — Register a new student profile
export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    if (!data.name || !data.email) {
      return NextResponse.json({ error: "Identity (name) and Network (email) are required." }, { status: 400 });
    }

    const hostelId = session.hostelId || data.hostelId;

    const student = await studentService.createStudent({
      ...data,
      hostelId,
      role: "student",
      status: data.status || "active",
    });

    return NextResponse.json({ 
      success: true,
      message: "Entity registered successfully", 
      id: student._id 
    });
  } catch (error) {
    console.error("POST /api/students error:", error);
    return NextResponse.json({ error: error.message || "Failed to commit entity registration." }, { status: 500 });
  }
}
