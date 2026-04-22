import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { complaintService } from "@/services/server/complaintService";
import { notificationService } from "@/services/server/notificationService";

// GET /api/complaints — Fetch complaints with optional filters
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const hostelId = searchParams.get("hostelId") || session.hostelId;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const { complaints } = await complaintService.getComplaints({
      hostelId,
      studentId,
      status: status === 'all' ? null : status,
      priority: priority === 'all' ? null : priority
    });
    
    return NextResponse.json(complaints);
  } catch (error) {
    console.error("GET /api/complaints error:", error);
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
  }
}

// POST /api/complaints — Create a new complaint
export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { studentId, studentName, roomNumber, subject, description, category, priority } = data;

    if (!studentId || !subject || !description) {
      return NextResponse.json({ error: "Student ID, subject, and description are required" }, { status: 400 });
    }

    const priorityMap = {
      'Emergency': 'high',
      'Urgent': 'medium',
      'Normal': 'low'
    };
    const dbPriority = priorityMap[priority] || priority?.toLowerCase() || "low";

    const hId = data.hostelId || session.hostelId;
    if (!hId) {
      return NextResponse.json({ error: "Hostel context missing" }, { status: 400 });
    }

    const complaint = await complaintService.createComplaint({
      hostelId: hId,
      studentId,
      studentName: studentName || "",
      roomNumber: roomNumber || "",
      subject,
      description,
      category: category || "Maintenance",
      priority: dbPriority,
      status: "Pending"
    });
    
    // Notify Admins
    await notificationService.createNotification({
      hostelId: hId,
      recipientId: "all_admins",
      recipientRole: "admin",
      senderId: studentId,
      senderRole: "student",
      senderName: studentName || "A Student",
      type: "complaint_filed",
      title: "New Complaint Filed",
      message: `${studentName || "A resident"} filed a complaint: ${subject}`,
      actionUrl: "/admin/complaints"
    });

    return NextResponse.json({ message: "Complaint submitted successfully", id: complaint._id });
  } catch (error) {
    console.error("POST /api/complaints error:", error);
    return NextResponse.json({ error: "Failed to submit complaint" }, { status: 500 });
  }
}
