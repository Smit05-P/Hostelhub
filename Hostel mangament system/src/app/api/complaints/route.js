import { getAllComplaints, createComplaint, createNotification } from "@/lib/firestore";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/complaints — Fetch complaints with optional studentId and status filter
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const status = searchParams.get("status") || undefined;

    const cookieStore = await cookies();
    const hostelId = 
      request.headers.get("x-hostel-id") ||
      searchParams.get("hostelId") || 
      cookieStore.get("hostel-id")?.value;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const complaints = await getAllComplaints({ hostelId, studentId, status });
    return NextResponse.json(complaints);
  } catch (error) {
    console.error("GET /api/complaints error:", error);
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
  }
}

// POST /api/complaints — Create a new complaint
export async function POST(request) {
  try {
    let data;
    try {
      data = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Request body is required and must be valid JSON" }, { status: 400 });
    }

    const { studentId, studentName, roomNumber, subject, description, category, priority } = data;

    const cookieStore = await cookies();
    const hostelId = 
      data.hostelId || 
      request.headers.get("x-hostel-id") || 
      cookieStore.get("hostel-id")?.value || 
      "primary-hostel";

    const id = await createComplaint({ hostelId, studentId, studentName, roomNumber, subject, description, category, priority });
    
    // Notify Admins
    await createNotification({
      hostelId,
      recipientId: "admin_group",
      recipientRole: "admin",
      senderId: studentId,
      senderRole: "student",
      senderName: studentName || "A Student",
      type: "complaint_raised",
      title: `New Maintenance Issue: ${subject}`,
      message: `${studentName || "Resident"} from Room ${roomNumber || "N/A"} reported an issue (${priority} priority).`,
      actionUrl: "/admin/complaints"
    });

    return NextResponse.json({ message: "Complaint submitted successfully", id });
  } catch (error) {
    console.error("POST /api/complaints error:", error.message);
    return NextResponse.json({ error: error.message || "Failed to submit complaint" }, { status: 400 });
  }
}
