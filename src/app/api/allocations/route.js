import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Allocation from "@/models/Allocation";
import Student from "@/models/Student";
import Room from "@/models/Room";
import Hostel from "@/models/Hostel";
import Fee from "@/models/Fee";

const DURATION_MONTHS = { 
  "6M": 6, 
  "1Y": 12, "2Y": 24, "3Y": 36, "4Y": 48, "5Y": 60, "6Y": 72 
};

function calculateMonthlyFee({ student, room, hostel }) {
  const feeConfig = hostel?.settings?.feeConfig || {};
  const durationCode = student?.duration;

  if (durationCode && feeConfig[durationCode]) {
    const totalFee = Number(feeConfig[durationCode]) || 0;
    const months = DURATION_MONTHS[durationCode] || 12;
    const monthly = Math.round(totalFee / months);
    if (monthly > 0) return monthly;
  }

  if (student?.rentAmount && Number(student.rentAmount) > 0) {
    return Number(student.rentAmount);
  }

  if (room?.rent && Number(room.rent) > 0) {
    return Number(room.rent);
  }

  return 0;
}

function resolveDueDate(hostel) {
  const today = new Date();
  const dueDayRaw = Number(hostel?.settings?.rentDueDay);
  const dueDay = Number.isFinite(dueDayRaw) ? Math.min(28, Math.max(1, dueDayRaw)) : 5;
  return new Date(today.getFullYear(), today.getMonth(), dueDay);
}

// GET /api/allocations — List all active allocations
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";
    const hostelId = session.hostelId || searchParams.get("hostelId");

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    await dbConnect();
    let query = { hostelId };
    if (status !== "all") {
      query.status = status.toLowerCase();
    }

    const allocations = await Allocation.find(query)
      .populate('studentId')
      .populate('roomId')
      .sort({ createdAt: -1 });

    return NextResponse.json(allocations);
  } catch (error) {
    console.error("GET /api/allocations error:", error);
    return NextResponse.json({ error: "Failed to fetch allocations" }, { status: 500 });
  }
}

// POST /api/allocations — Atomically allocate a student to a room
export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, roomId, adminId, hostelId: requestedHostelId } = await request.json();
    const hostelId = requestedHostelId || session.hostelId;

    if (!studentId || !roomId) {
      return NextResponse.json({ error: "studentId and roomId are required" }, { status: 400 });
    }
    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }

    await dbConnect();

    const [student, room, hostel] = await Promise.all([
      Student.findById(studentId).lean(),
      Room.findById(roomId).lean(),
      Hostel.findById(hostelId).lean(),
    ]);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const monthlyFeeAmount = calculateMonthlyFee({ student, room, hostel });
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const dueDate = resolveDueDate(hostel);
    
    // 1. Create Allocation record
    const allocation = await Allocation.create({
      studentId,
      roomId,
      hostelId,
      status: 'active',
      adminId: adminId || session.userId
    });

    // 2. Update Student
    await Student.findByIdAndUpdate(studentId, {
      hostelId,
      roomId,
      status: 'Active',
      rentAmount: monthlyFeeAmount
    });

    // 3. Update Room (occupancy)
    await Room.findByIdAndUpdate(roomId, {
      $addToSet: { occupants: studentId }
    });

    // 4. Create Total Stay Fee record
    // We calculate the total amount based on duration (monthly * months)
    const durationMonths = DURATION_MONTHS[student.duration] || 1;
    const totalStayAmount = monthlyFeeAmount * durationMonths;

    await Fee.create({
      studentId,
      studentName: student.name || "",
      roomId,
      roomNumber: room.roomNumber || "",
      hostelId,
      amount: totalStayAmount,
      month: currentMonth,
      year: currentYear,
      dueDate,
      status: "Pending",
      isTotalStayFee: true,
      adminRemarks: `Full Stay Fee (${student.duration})`
    });

    // Update student balance/rentAmount
    await Student.findByIdAndUpdate(studentId, {
      rentAmount: monthlyFeeAmount,
      balance: totalStayAmount // Initialize balance with total fees
    });

    return NextResponse.json({
      message: "Student allocated successfully and Total Stay Fees generated.",
      allocationId: allocation._id,
      monthlyFee: monthlyFeeAmount,
      totalFee: totalStayAmount,
      duration: student.duration
    });
  } catch (error) {
    console.error("POST /api/allocations error:", error);
    return NextResponse.json({ error: error.message || "Allocation failed" }, { status: 500 });
  }
}

// DELETE /api/allocations — Deallocate a student from their current room
export async function DELETE(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, roomId } = await request.json();

    if (!studentId || !roomId) {
      return NextResponse.json({ error: "studentId and roomId are required" }, { status: 400 });
    }

    await dbConnect();

    // 1. Update active allocations to ended
    await Allocation.updateMany(
      { studentId, roomId, status: 'active' },
      { status: 'ended', deallocatedAt: new Date() }
    );

    // 2. Clear Student room
    await Student.findByIdAndUpdate(studentId, {
      $unset: { roomId: "" }
    });

    // 3. Update Room (remove occupancy)
    await Room.findByIdAndUpdate(roomId, {
      $pull: { occupants: studentId }
    });

    return NextResponse.json({ message: "Student deallocated successfully" });
  } catch (error) {
    console.error("DELETE /api/allocations error:", error);
    return NextResponse.json({ error: error.message || "Deallocation failed" }, { status: 500 });
  }
}
