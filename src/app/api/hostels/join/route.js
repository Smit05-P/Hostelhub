import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { hostelService } from "@/services/server/hostelService";
import { joinRequestService } from "@/services/server/joinRequestService";
import { studentService } from "@/services/server/studentService";
import Student from "@/models/Student";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { method, studentId, joiningDate, duration } = data;

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required." }, { status: 400 });
    }

    await dbConnect();

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found in database." }, { status: 404 });
    }

    // Preliminary checks
    if (student.hostelId && student.hostelStatus === "Approved") {
      return NextResponse.json({ 
        error: "You are already a member of a hostel. Please leave your current hostel before joining a new one." 
      }, { status: 409 });
    }

    let targetHostel = null;

    if (method === "code") {
      const { joinCode } = data;
      if (!joinCode) {
        return NextResponse.json({ error: "Join code is required." }, { status: 400 });
      }
      targetHostel = await hostelService.validateJoinCode(joinCode);
      if (!targetHostel) {
        return NextResponse.json({ error: "Invalid join code." }, { status: 404 });
      }
    } else if (method === "request") {
      const { hostelId } = data;
      if (!hostelId) {
        return NextResponse.json({ error: "Hostel ID is required." }, { status: 400 });
      }
      const HostelModel = mongoose.models.Hostel || (await import("@/models/Hostel")).default;
      targetHostel = await HostelModel.findById(hostelId).lean();
      if (!targetHostel) {
        return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "Invalid join method." }, { status: 400 });
    }

    if (targetHostel.status !== "Active") {
      return NextResponse.json({ error: "This hostel is currently not accepting new students." }, { status: 403 });
    }

    // 2. Handle Auto-approve
    if (targetHostel.autoApprove) {
      // Create an approved request for history/audit
      await joinRequestService.createRequest({
        userId: studentId,
        userName: data.userName || student.name,
        userEmail: data.userEmail || student.email,
        hostelId: targetHostel._id,
        hostelName: targetHostel.name,
        method: method, // 'code' or 'search'
        status: "Approved", // Set as Approved immediately
        duration: duration || student.duration,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        handledAt: new Date(),
        adminRemarks: "Auto-approved by system."
      });

      await Student.findByIdAndUpdate(studentId, {
        hostelId: targetHostel._id,
        hostelStatus: "Approved",
        status: "Active",
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        duration: duration || student.duration
      });

      return NextResponse.json({
        success: true,
        status: "Approved",
        hostelId: targetHostel._id,
        message: `Successfully joined ${targetHostel.name}!`
      });
    }

    // 3. Create Manual Join Request
    try {
      await joinRequestService.createRequest({
        userId: studentId,
        userName: data.userName || student.name,
        userEmail: data.userEmail || student.email,
        hostelId: targetHostel._id,
        hostelName: targetHostel.name,
        method: method, // 'code' or 'search'
        status: "Pending",
        duration: duration || student.duration,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      });

      await Student.findByIdAndUpdate(studentId, {
        hostelStatus: "Pending"
      });

      return NextResponse.json({
        success: true,
        status: "Pending",
        hostelId: targetHostel._id,
        message: `Join request sent to ${targetHostel.name}. Pending admin approval.`
      });
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: "Invalid join method." }, { status: 400 });

  } catch (error) {
    console.error("POST /api/hostels/join error:", error);
    return NextResponse.json({ 
      error: "Internal server error during join process.",
      details: error.message 
    }, { status: 500 });
  }
}
