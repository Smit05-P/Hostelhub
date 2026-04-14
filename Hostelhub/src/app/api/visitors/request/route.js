import { createVisitorRequest, getAllVisitorRequests, createNotification } from "@/lib/firestore";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const hostelId = searchParams.get("hostelId");

    if (!studentId || !hostelId) {
      return NextResponse.json({ error: "studentId and hostelId are required" }, { status: 400 });
    }

    const requests = await getAllVisitorRequests({ studentId, hostelId });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/visitors/request error:", error);
    return NextResponse.json({ error: "Failed to fetch visitor requests" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { 
      hostelId, studentId, studentName, roomNo, 
      visitorName, visitorPhone, relation, 
      visitDate, visitTime, duration, purpose, notes 
    } = data;

    if (!studentId || !visitorName || !visitDate || !visitTime || !purpose) {
      return NextResponse.json({ error: "Missing required visitor details" }, { status: 400 });
    }

    const requestId = await createVisitorRequest({
      hostelId,
      studentId,
      studentName,
      roomNo,
      visitorName,
      visitorPhone,
      relation,
      visitDate,
      visitTime,
      duration,
      purpose,
      notes
    });

    // Notify Admins
    await createNotification({
      hostelId,
      recipientId: "admin_group", // dummy ID since role is admin
      recipientRole: "admin",
      senderId: studentId,
      senderRole: "student",
      senderName: studentName || "A Student",
      type: "visitor_request",
      title: "New Visitor Request",
      message: `${studentName || "A resident"} requested a visit for ${visitorName} on ${visitDate}.`,
      actionUrl: "/admin/visitors"
    });

    return NextResponse.json({ message: "Visitor request sent successfully", requestId });
  } catch (error) {
    console.error("POST /api/visitors/request error:", error);
    return NextResponse.json({ error: "Failed to create visitor request" }, { status: 500 });
  }
}
