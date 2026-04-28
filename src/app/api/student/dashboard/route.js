import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Room from "@/models/Room";
import Fee from "@/models/Fee";
import Complaint from "@/models/Complaint";
import Notice from "@/models/Notice";

const titleCase = (value) => {
  if (!value) return "";
  return String(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export async function GET() {
  try {
    const session = await protect();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "student") {
      return NextResponse.json({ error: "Forbidden. Expected student role." }, { status: 403 });
    }

    await dbConnect();

    const studentId = session.userId;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Fetch profile first to get hostelId
    const profile = await Student.findById(studentId)
      .select('name email phone address hostelId roomId rentAmount hostelStatus status profileImage enrollmentId arrivalDate duration termEndDate daysLeft joiningDate balance')
      .populate('roomId', 'roomNumber capacity rent status')
      .lean();

    if (!profile) {
      return NextResponse.json({ error: 'Resident record not found in database.' }, { status: 404 });
    }

    const hostelId = profile.hostelId;

    // Fetch related data in parallel for performance
    const [fees, complaints, notices] = await Promise.all([
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
      hostelId ? Notice.find({ 
        hostelId,
        $or: [
          { date: { $gte: profile.joiningDate || new Date(0) } },
          { createdAt: { $gte: profile.joiningDate || new Date(0) } }
        ]
      })
        .sort({ date: -1, createdAt: -1 })
        .limit(3)
        .lean() : Promise.resolve([])
    ]);

    const normalizedFees = (fees || []).map((fee) => ({
      ...fee,
      status: titleCase(fee.status),
    }));

    const normalizedComplaints = (complaints || []).map((complaint) => ({
      ...complaint,
      status: titleCase(complaint.status),
      response: complaint.remarks || null,
    }));

    const currentFee = normalizedFees.find(
      (fee) => fee.month === currentMonth && fee.year === currentYear
    ) || null;

    return NextResponse.json({
      profile,
      room: profile.roomId || null,
      fees: normalizedFees,
      complaints: normalizedComplaints,
      notices: notices || [],
      currentFee,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[API-DASHBOARD] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to establish connection with the database.', 
      details: error.message 
    }, { status: 500 });
  }
}
