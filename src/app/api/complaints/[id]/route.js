import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { complaintService } from "@/services/server/complaintService";
import { notificationService } from "@/services/server/notificationService";

// GET /api/complaints/[id] — Fetch a single complaint
export async function GET(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const complaint = await complaintService.getComplaintById(id);
    
    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }
    
    return NextResponse.json(complaint);
  } catch (error) {
    console.error("GET /api/complaints/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch complaint" }, { status: 500 });
  }
}

// PATCH /api/complaints/[id] — Update status, response, or internalNotes (admin only)
export async function PATCH(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { status, response, remarks } = data;

    const complaint = await complaintService.getComplaintById(id);
    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    // Check for changes to notify student
    const statusChanged = status && status !== complaint.status;
    const responseAdded = response && response !== complaint.remarks; // remarks in Mongo matches response in Firestore logic

    await complaintService.updateComplaint(id, {
      status: status || complaint.status,
      remarks: response || complaint.remarks, // mapping firestore's 'response' to mongo's 'remarks'
    });

    // Notify Student
    if (statusChanged || responseAdded) {
      const isResolved = status === 'resolved';
      await notificationService.createNotification({
        hostelId: complaint.hostelId,
        recipientId: complaint.studentId.toString(),
        recipientRole: "student",
        senderId: session.userId,
        senderRole: "admin",
        senderName: "Maintenance Team",
        type: "complaint_updated",
        title: isResolved ? "Complaint Resolved ✅" : "Complaint Updated",
        message: `Your complaint "${complaint.subject}" has been updated. ${response ? `Admin response: ${response}` : ""}`,
        actionUrl: "/student/complaints"
      });
    }

    return NextResponse.json({ message: "Complaint updated successfully" });
  } catch (error) {
    console.error("PATCH /api/complaints/[id] error:", error);
    return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
  }
}

// DELETE /api/complaints/[id] — Remove a complaint
export async function DELETE(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await complaintService.deleteComplaint(id);
    
    return NextResponse.json({ message: "Complaint deleted" });
  } catch (error) {
    console.error("DELETE /api/complaints/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete complaint" }, { status: 500 });
  }
}
