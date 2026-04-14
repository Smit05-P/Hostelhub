import { updateComplaint, getComplaintById, deleteComplaint, createNotification } from "@/lib/firestore";
import { NextResponse } from "next/server";

// VALID complaint statuses — unified between admin and student UIs
const VALID_STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

// GET /api/complaints/[id] — Fetch a single complaint
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const complaint = await getComplaintById(id);
    if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    return NextResponse.json(complaint);
  } catch (error) {
    console.error("GET /api/complaints/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch complaint" }, { status: 500 });
  }
}

// PATCH /api/complaints/[id] — Update status, response, or internalNotes (admin only)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status, response, internalNotes } = await request.json();

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid values: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const complaint = await getComplaintById(id);
    if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

    await updateComplaint(id, { status, response, internalNotes });

    // Notify Student on Resolution or Update
    if ((status && status !== complaint.status) || (response && response !== complaint.response)) {
       const isResolved = status === "Resolved";
       await createNotification({
         hostelId: complaint.hostelId,
         recipientId: complaint.studentId,
         recipientRole: "student",
         senderId: "system",
         senderRole: "admin",
         senderName: "Maintenance Team",
         type: "complaint_resolved",
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
    const { id } = await params;
    const complaint = await getComplaintById(id);
    if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    
    await deleteComplaint(id);
    return NextResponse.json({ message: "Complaint deleted" });
  } catch (error) {
    console.error("DELETE /api/complaints/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete complaint" }, { status: 500 });
  }
}
