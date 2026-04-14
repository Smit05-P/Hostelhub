import { getAllVisitorRequests, updateVisitorRequestStatus, createVisitor, createNotification } from "@/lib/firestore";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hostelId = searchParams.get("hostelId");
    const status = searchParams.get("status") || "pending";

    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }

    const requests = await getAllVisitorRequests({ hostelId, status });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/visitors/admin/requests error:", error);
    return NextResponse.json({ error: "Failed to fetch visitor requests" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { requestId, status, adminNote, visitorData } = data;

    if (!requestId || !status) {
      return NextResponse.json({ error: "requestId and status are required" }, { status: 400 });
    }

    // 1. Update the request status
    await updateVisitorRequestStatus(requestId, { status, adminNote });

    // 2. If approved, optionally sync to the primary visitor log
    if (status === "approved" && visitorData) {
      await createVisitor({
        ...visitorData,
        type: "Pre-registered",
        status: "Expected", 
      });
    }

    // 3. Notify Student
    if (visitorData && visitorData.studentId) {
      const isApproved = status === "approved";
      await createNotification({
        hostelId: visitorData.hostelId,
        recipientId: visitorData.studentId,
        recipientRole: "student",
        senderId: "system",
        senderRole: "admin",
        senderName: "Administration",
        type: isApproved ? "visitor_approved" : "visitor_rejected",
        title: isApproved ? "Visitor Approved ✅" : "Visitor Rejected ❌",
        message: isApproved 
          ? `Your visitor ${visitorData.visitorName} has been approved for ${visitorData.visitDate}.`
          : `Your visitor ${visitorData.visitorName} was rejected. Reason: ${adminNote || "Not provided"}`,
        actionUrl: "/student/visitors"
      });
    }

    return NextResponse.json({ message: `Request ${status} successfully` });
  } catch (error) {
    console.error("PUT /api/visitors/admin/requests error:", error);
    return NextResponse.json({ error: "Failed to update visitor request" }, { status: 500 });
  }
}
