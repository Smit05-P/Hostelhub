import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import JoinRequest from "@/models/JoinRequest";
import Student from "@/models/Student";
import { studentService } from "@/services/server/studentService";

export async function POST(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { id } = params;
    const { hostelId, userId } = await request.json();

    if (!hostelId || !userId) {
      return NextResponse.json(
        { error: "Hostel ID and User ID are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // 1. Find and update the join request
    const joinRequest = await JoinRequest.findById(id);
    if (!joinRequest) {
      return NextResponse.json({ error: "Join request not found" }, { status: 404 });
    }

    if (joinRequest.status !== 'Pending') {
      return NextResponse.json({ error: `Request has already been ${joinRequest.status}` }, { status: 409 });
    }

    joinRequest.status = 'Approved';
    joinRequest.handledAt = new Date();
    await joinRequest.save();

    // 2. Update the student record in MongoDB
    let student = await Student.findOne({ userId, hostelId });
    if (!student) {
      student = await studentService.createStudent({
        userId,
        hostelId,
        name: joinRequest.userName,
        status: 'Active',
        hostelStatus: 'Approved',
        // other default fields
      });
    } else {
      // Update existing student
      student.hostelId = hostelId;
      student.hostelStatus = 'Approved';
      student.status = 'Active';
      await student.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Join request approved",
        studentId: student._id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/hostels/join-requests/[id]/approve error:", error);
    return NextResponse.json(
      { error: error.message || "Operation failed" },
      { status: 500 }
    );
  }
}
