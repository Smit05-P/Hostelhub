import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import JoinRequest from "@/models/JoinRequest";

export async function POST(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { id } = params;
    const { reason } = await request.json();

    await dbConnect();

    const joinRequest = await JoinRequest.findById(id);
    if (!joinRequest) {
      return NextResponse.json({ error: "Join request not found" }, { status: 404 });
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ error: `Request has already been ${joinRequest.status}` }, { status: 409 });
    }

    joinRequest.status = 'rejected';
    joinRequest.adminRemarks = reason || "";
    joinRequest.handledAt = new Date();
    await joinRequest.save();

    // Update student status
    const student = await Student.findOne({ userId: joinRequest.userId });
    if (student) {
      student.hostelStatus = 'NO_HOSTEL';
      await student.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Join request rejected",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/hostels/join-requests/[id]/reject error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject request" },
      { status: 500 }
    );
  }
}
