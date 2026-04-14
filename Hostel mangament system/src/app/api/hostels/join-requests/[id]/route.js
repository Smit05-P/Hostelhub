import { NextResponse } from "next/server";
import { approveJoinRequest, rejectJoinRequest } from "@/lib/firestore";

export async function PATCH(request, { params }) {
  try {
    const { id: requestId } = await params;
    const body = await request.json();
    const { action, adminNote, studentId, hostelId } = body;

    if (!action) {
      return NextResponse.json({ error: "Action (approve or reject) is required" }, { status: 400 });
    }

    if (!studentId || !hostelId) {
      return NextResponse.json({ error: "Student ID and Hostel ID are required for validation" }, { status: 400 });
    }

    if (action === "approve") {
      await approveJoinRequest({ requestId, userId: studentId, hostelId });
    } else if (action === "reject") {
      await rejectJoinRequest({ requestId, reason: adminNote });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, status: action === "approve" ? "approved" : "rejected" });
  } catch (error) {
    console.error("PATCH /api/hostels/join-requests/[id] error:", error);
    
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message.includes("does not match")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: requestId } = await params;
    
    const { cancelJoinRequest } = require("@/lib/firestore");
    await cancelJoinRequest(requestId);
    
    return NextResponse.json({ success: true, message: "Request cancelled" });
  } catch (error) {
    console.error("DELETE /api/hostels/join-requests/[id] error:", error);
    
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || "Failed to cancel request" }, { status: 500 });
  }
}
