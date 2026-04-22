import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { joinRequestService } from "@/services/server/joinRequestService";
import { notificationService } from "@/services/server/notificationService";

// PATCH /api/hostels/join-requests/[id] - Approve or reject request
export async function PATCH(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: requestId } = await params;
    const { action, adminNote, studentId, hostelId } = await request.json();

    if (!action) {
      return NextResponse.json({ error: "Action (approve or reject) is required" }, { status: 400 });
    }

    const statusMap = {
      approve: 'Approved',
      reject: 'Rejected'
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedRequest = await joinRequestService.handleRequest(requestId, newStatus, adminNote);

    // Notify Student
    if (studentId || updatedRequest.userId) {
      const isApproved = newStatus === 'Approved';
      await notificationService.createNotification({
        hostelId: hostelId || updatedRequest.hostelId,
        recipientId: studentId || updatedRequest.userId,
        recipientRole: "student",
        senderId: session.userId,
        senderRole: "admin",
        senderName: "Administration",
        type: isApproved ? "join_approved" : "join_rejected",
        title: isApproved ? "Join Request Approved ✅" : "Join Request Rejected ❌",
        message: isApproved 
          ? `Your request to join the hostel has been approved.`
          : `Your request to join the hostel was rejected. ${adminNote ? `Reason: ${adminNote}` : ""}`,
        actionUrl: "/dashboard"
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("PATCH /api/hostels/join-requests/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}

// DELETE /api/hostels/join-requests/[id] - Cancel/delete request
export async function DELETE(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: requestId } = await params;

    const { default: dbConnect } = await import("@/lib/mongodb");
    const { default: JoinRequest } = await import("@/models/JoinRequest");

    await dbConnect();
    const joinRequest = await JoinRequest.findById(requestId);

    if (!joinRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Only the request owner or an admin can delete
    if (session.role !== 'admin' && session.userId !== joinRequest.userId) {
      return NextResponse.json({ error: "Not authorized to delete this request" }, { status: 403 });
    }

    await JoinRequest.findByIdAndDelete(requestId);

    return NextResponse.json({ success: true, message: "Request deleted" });
  } catch (error) {
    console.error("DELETE /api/hostels/join-requests/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete request" }, { status: 500 });
  }
}
