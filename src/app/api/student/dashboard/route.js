import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Fee from "@/models/Fee";
import Complaint from "@/models/Complaint";
import Notice from "@/models/Notice";
import mongoose from "mongoose";

const titleCase = (value = "") => value
  .split("_")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

export async function GET() {
  try {
    const session = await protect();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const studentId = session.userId;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const student = await Student.findById(studentId).select('hostelId').lean();
    const hostelId = student?.hostelId;

    const [profile, fees, complaints, notices] = await Promise.all([
      Student.findById(studentId)
        .select('name email phone address hostelId roomId rentAmount hostelStatus status profileImage enrollmentId arrivalDate duration termEndDate daysLeft joiningDate balance')
        .populate('roomId', 'roomNumber capacity rent status')
        .lean(),
      Fee.find({ studentId })
        .select('amount month year status dueDate createdAt isTotalStayFee adminRemarks')
        .sort({ year: -1, month: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      Complaint.find({ studentId })
        .select('subject category status remarks createdAt')
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
      hostelId ? Notice.find({ hostelId: new mongoose.Types.ObjectId(hostelId) })
        .sort({ date: -1, createdAt: -1 })
        .limit(3)
        .lean() : [],
    ]);

    if (!profile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const room = profile.roomId || null;
    const normalizedFees = fees.map((fee) => ({
      ...fee,
      status: titleCase(fee.status),
    }));
    const normalizedComplaints = complaints.map((complaint) => ({
      ...complaint,
      status: titleCase(complaint.status),
      response: complaint.remarks || null,
    }));

    const currentFee = normalizedFees.find(
      (fee) => fee.month === currentMonth && fee.year === currentYear
    ) || null;

    return NextResponse.json({
      profile: {
        ...profile,
        roomId: room?._id || profile.roomId || null,
      },
      room,
      fees: normalizedFees,
      complaints: normalizedComplaints,
      notices,
      currentFee,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('GET /api/student/dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch student dashboard data' }, { status: 500 });
  }
}
