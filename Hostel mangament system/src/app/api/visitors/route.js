import { getAllVisitors, createVisitor, createNotification } from "@/lib/firestore";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/visitors - Fetch all visitor records with optional studentId filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hostStudentId = searchParams.get("hostStudentId") || undefined;
    
    const cookieStore = await cookies();
    const hostelId = 
      request.headers.get("x-hostel-id") ||
      searchParams.get("hostelId") || 
      cookieStore.get("hostel-id")?.value;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const visitors = await getAllVisitors({ hostelId, hostStudentId });
    return NextResponse.json(visitors);
  } catch (error) {
    console.error("GET /api/visitors error:", error);
    return NextResponse.json({ error: "Failed to fetch visitors" }, { status: 500 });
  }
}

// POST /api/visitors - Log a new check-in
export async function POST(request) {
  try {
    let data;
    try {
      data = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Request body required" }, { status: 400 });
    }

    const { name, hostStudentId, studentName } = data;

    if (!name || !hostStudentId) {
      return NextResponse.json({ error: "Missing required fields (name, hostStudentId)" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const hostelId = data.hostelId || cookieStore.get("hostel-id")?.value || "primary-hostel";

    const id = await createVisitor({ ...data, hostelId });

    // Notify Student
    try {
      await createNotification({
        hostelId,
        recipientId: hostStudentId,
        recipientRole: "student",
        senderId: "system",
        senderRole: "admin",
        senderName: "Administration",
        type: "visitor_checkin",
        title: "Visitor Checked In 👤",
        message: `Your visitor ${name} has just checked in at the hostel gate.`,
        actionUrl: "/student/visitors"
      });
    } catch (notifyErr) {
      console.error("Failed to send check-in notification:", notifyErr);
      // Don't fail the whole request if notification fails
    }

    return NextResponse.json({ message: "Check-in successful", id });
  } catch (error) {
    console.error("POST /api/visitors error:", error);
    return NextResponse.json({ error: error.message || "Failed to process check-in" }, { status: 400 });
  }
}
