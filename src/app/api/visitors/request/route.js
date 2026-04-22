import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { visitorService } from "@/services/server/visitorService";
import { notificationService } from "@/services/server/notificationService";

// GET /api/visitors/request - Fetch visitor requests
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const hostelId = session.hostelId || searchParams.get("hostelId");

    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }

    const { requests } = await visitorService.getAllVisitorRequests({ 
      hostelId, 
      studentId 
    });
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/visitors/request error:", error);
    return NextResponse.json({ error: "Failed to fetch visitor requests" }, { status: 500 });
  }
}

// POST /api/visitors/request - Create a new visitor request
export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { 
      hostelId, studentId, studentName, roomNo, 
      visitorName, visitorPhone, relation, 
      visitDate, visitTime, duration, purpose, notes 
    } = data;

    if (!studentId || !visitorName || !visitDate || !purpose) {
      return NextResponse.json({ error: "Missing required visitor details" }, { status: 400 });
    }

    const finalHostelId = session.hostelId || hostelId;

    const visitorRequest = await visitorService.createVisitorRequest({
      hostelId: finalHostelId,
      studentId,
      studentName,
      roomNo,
      visitorName,
      visitorPhone,
      relation,
      visitDate: new Date(visitDate),
      visitTime,
      duration,
      purpose,
      notes,
      status: 'pending'
    });

    // Notify Admins
    await notificationService.createNotification({
      hostelId: finalHostelId,
      recipientId: "all_admins",
      recipientRole: "admin",
      senderId: studentId,
      senderRole: "student",
      senderName: studentName || "A Student",
      type: "visitor_request",
      title: "New Visitor Request",
      message: `${studentName || "A resident"} requested a visit for ${visitorName} on ${visitDate}.`,
      actionUrl: "/admin/visitors"
    });

    return NextResponse.json({ 
      message: "Visitor request sent successfully", 
      requestId: visitorRequest._id 
    });
  } catch (error) {
    console.error("POST /api/visitors/request error:", error);
    return NextResponse.json({ error: "Failed to create visitor request" }, { status: 500 });
  }
}
