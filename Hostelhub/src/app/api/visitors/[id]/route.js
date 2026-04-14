import { updateVisitorStatus, updateVisitor, getVisitorById, deleteVisitor, createNotification } from "@/lib/firestore";
import { NextResponse } from "next/server";

// GET /api/visitors/[id] - Fetch single visitor details
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const visitor = await getVisitorById(id);

    if (!visitor) {
      return NextResponse.json({ error: "Visitor log not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...visitor,
      checkIn: visitor.checkIn?.toDate?.()?.toISOString() || visitor.checkIn || null,
      checkOut: visitor.checkOut?.toDate?.()?.toISOString() || visitor.checkOut || null,
    });
  } catch (error) {
    console.error("GET /api/visitors/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch visitor record" }, { status: 500 });
  }
}

// PUT /api/visitors/[id] - Update visitor (e.g., Check Out or Edit)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const existing = await getVisitorById(id);
    if (!existing) {
       return NextResponse.json({ error: "Visitor log not found" }, { status: 404 });
    }

    // If only status is passed (like Checkout), use status update
    if (Object.keys(body).length === 1 && body.status) {
      await updateVisitorStatus(id, { status: body.status });

      // Notify Student on Checkout
      if (body.status === "Departed" && existing.hostStudentId) {
        try {
          await createNotification({
            hostelId: existing.hostelId,
            recipientId: existing.hostStudentId,
            recipientRole: "student",
            senderId: "system",
            senderRole: "admin",
            senderName: "Administration",
            type: "visitor_checkout",
            title: "Visitor Checked Out 👋",
            message: `Your visitor ${existing.name} has just checked out and departed.`,
            actionUrl: "/student/visitors"
          });
        } catch (notifyErr) {
          console.error("Failed to send checkout notification:", notifyErr);
        }
      }

      return NextResponse.json({ message: "Visitor status updated successfully" });
    }

    // Otherwise, handle as full edit
    await updateVisitor(id, body);
    return NextResponse.json({ message: "Visitor updated successfully" });
  } catch (error) {
    console.error("PUT /api/visitors/[id] error:", error);
    return NextResponse.json({ error: "Failed to update visitor" }, { status: 500 });
  }
}

// DELETE /api/visitors/[id] - Delete visitor
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await deleteVisitor(id);
    return NextResponse.json({ message: "Visitor deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/visitors/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete visitor" }, { status: 500 });
  }
}
