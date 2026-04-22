import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { visitorService } from "@/services/server/visitorService";
import { notificationService } from "@/services/server/notificationService";

// GET /api/visitors/admin/requests - Admin view of visitor requests
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hostelId = session.hostelId || searchParams.get("hostelId");
    const status = searchParams.get("status") || "pending";

    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }

    const { requests } = await visitorService.getAllVisitorRequests({ 
      hostelId, 
      status 
    });
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/visitors/admin/requests error:", error);
    return NextResponse.json({ error: "Failed to fetch visitor requests" }, { status: 500 });
  }
}

// PUT /api/visitors/admin/requests - Update request status (Approve/Reject)
export async function PUT(request) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { requestId, status, adminNote, visitorData } = data;

    if (!requestId || !status) {
      return NextResponse.json({ error: "requestId and status are required" }, { status: 400 });
    }

    // 1. Update the request status
    await visitorService.updateVisitorRequestStatus(requestId, status, adminNote);

    // 2. If approved, optionally sync to the primary visitor log
    if (status === "approved" && visitorData) {
      await visitorService.createVisitor({
        ...visitorData,
        type: "Pre-registered",
        status: "Completed",
      });
    }

    // 3. Notify Student
    if (visitorData && visitorData.studentId) {
      const isApproved = status === "approved";
      await notificationService.createNotification({
        hostelId: session.hostelId || visitorData.hostelId,
        recipientId: visitorData.studentId,
        recipientRole: "student",
        senderId: session.userId,
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
