import { getAllStudents, createStudent } from "@/lib/firestore";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/students — Fetch all students with search, filter, and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const filterRoom = searchParams.get("room_id") || "all";
    const filterStatus = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const cookieStore = await cookies();
    
    // Prioritize header (injected by middleware) -> searchParam -> cookie
    const hostelId = 
      request.headers.get("x-hostel-id") || 
      searchParams.get("hostelId") || 
      cookieStore.get("hostel-id")?.value;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const students = await getAllStudents({ hostelId, search, filterRoom, filterStatus });

    const total = students.length;
    const paginated = students.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ students: paginated, total, page, limit });
  } catch (error) {
    console.error("GET /api/students error:", error);
    const message = error.code === "permission-denied" 
      ? "Security Protocol Violation: Access denied by cloud rules." 
      : "Synchronization Failure: Ensure valid composite indexing for scoped queries.";
    return NextResponse.json({ error: message, detail: error.message }, { status: 500 });
  }
}

// POST /api/students — Register a new student profile in the 'users' collection
export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.name || !data.email) {
      return NextResponse.json({ error: "Identity (name) and Network (email) are required." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const hostelId = 
      request.headers.get("x-hostel-id") || 
      data.hostelId || 
      cookieStore.get("hostel-id")?.value;

    const id = await createStudent({
      ...data,
      hostelId: hostelId || "primary-hostel"
    });

    return NextResponse.json({ 
      success: true,
      message: "Entity registered successfully", 
      id 
    });
  } catch (error) {
    console.error("POST /api/students error:", error);
    return NextResponse.json({ error: error.message || "Failed to commit entity registration." }, { status: 500 });
  }
}
