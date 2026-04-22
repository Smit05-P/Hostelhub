import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Fee from "@/models/Fee";
import Student from "@/models/Student";
import Hostel from "@/models/Hostel";

// GET /api/fees - Fetch all fees with optional filters
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    const hostelId = session.hostelId || searchParams.get("hostelId");

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    await dbConnect();
    let query = { hostelId };

    if (studentId) query.studentId = studentId;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status && status !== "all") {
      // Normalize status for case-sensitive DB query (e.g., 'paid' -> 'Paid')
      query.status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    // DYNAMIC FEE GENERATION
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Find active students to generate fees for
    let studentQuery = { hostelId, status: 'Active', hostelStatus: 'Approved' };
    if (studentId) studentQuery._id = studentId;

    const activeStudents = await Student.find(studentQuery).populate('roomId').lean();
    
    // Find existing fees for current month to avoid duplicates
    const existingFees = await Fee.find({
      hostelId,
      $or: [
        { month: currentMonth, year: currentYear },
        { isTotalStayFee: true }
      ],
      ...(studentId ? { studentId } : {})
    }).lean();

    const existingStudentIds = new Set(existingFees.map(f => f.studentId.toString()));
    const feesToCreate = [];
    const hostel = await Hostel.findById(hostelId).lean();
    const feeConfig = hostel?.settings?.feeConfig || {};
    const DURATION_MONTHS = { "6M": 6, "1Y": 12, "2Y": 24, "3Y": 36, "4Y": 48 };

    for (const student of activeStudents) {
      if (!existingStudentIds.has(student._id.toString())) {
        let amount = student.rentAmount;
        
        // If no custom rentAmount, try duration-based feeConfig
        if (!amount && student.duration && feeConfig[student.duration]) {
          const totalFee = feeConfig[student.duration];
          const months = DURATION_MONTHS[student.duration] || 12;
          amount = Math.round(totalFee / months);
        }

        // Fallback to room rent
        if (!amount && student.roomId && student.roomId.rent) {
          amount = student.roomId.rent;
        }

        // Fallback to hostel default rent if available
        if (!amount && hostel?.settings?.baseRent) {
          amount = hostel.settings.baseRent;
        }

        if (!amount) amount = 0;

        feesToCreate.push({
          studentId: student._id,
          studentName: student.name,
          roomId: student.roomId ? student.roomId._id : null,
          roomNumber: student.roomId ? student.roomId.roomNumber : "",
          hostelId,
          amount,
          month: currentMonth,
          year: currentYear,
          dueDate: new Date(currentYear, currentMonth - 1, 5),
          status: 'pending'
        });
      }
    }

    if (feesToCreate.length > 0) {
      await Fee.insertMany(feesToCreate);
    }

    // FIX FOR $0 PENDING FEES: If any existing pending fees have 0 amount, try to fix them
    const pendingZeroFees = await Fee.find({ 
      hostelId, 
      status: { $in: ['pending', 'Pending'] }, 
      amount: 0, 
      ...(studentId ? { studentId } : {}) 
    });

    if (pendingZeroFees.length > 0) {
      for (const fee of pendingZeroFees) {
        if (!fee.studentId) continue;
        
        const student = await Student.findById(fee.studentId).populate('roomId').lean();
        if (student) {
          let correctedAmount = student.rentAmount;
          
          if (!correctedAmount && student.duration && feeConfig[student.duration]) {
            const totalFee = feeConfig[student.duration];
            const months = DURATION_MONTHS[student.duration] || 12;
            correctedAmount = Math.round(totalFee / months);
          }

          if (!correctedAmount && student.roomId && student.roomId.rent) {
            correctedAmount = student.roomId.rent;
          }

          if (!correctedAmount && hostel?.settings?.baseRent) {
            correctedAmount = hostel.settings.baseRent;
          }

          if (correctedAmount > 0) {
            await Fee.findByIdAndUpdate(fee._id, { amount: correctedAmount });
          }
        }
      }
    }

    const fees = await Fee.find(query)
      .select('studentId studentName roomId roomNumber amount month year dueDate status paidAt paymentMethod createdAt isTotalStayFee adminRemarks')
      .populate('studentId', 'name email')
      .populate('roomId', 'roomNumber')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(fees, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/fees error:", error);
    return NextResponse.json({
      error: "Failed to fetch fees",
      detail: error.message
    }, { status: 500 });
  }
}

// POST /api/fees - Manually create a fee record
export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { studentId, studentName, roomId, roomNumber, amount, month, year, paymentMethod, dueDate } = data;

    if (!studentId || amount === undefined || amount === null || !month || !year) {
      return NextResponse.json({ error: "studentId, amount, month, and year are required" }, { status: 400 });
    }

    const hostelId = session.hostelId || data.hostelId;

    const today = new Date();
    const resolvedDueDate = dueDate
      ? new Date(dueDate)
      : new Date(today.getFullYear(), today.getMonth() + 1, 5);

    await dbConnect();
    const fee = await Fee.create({
      studentId,
      studentName: studentName || "",
      roomId: roomId || null,
      roomNumber: roomNumber || "",
      hostelId,
      amount: parseFloat(amount),
      month: parseInt(month),
      year: parseInt(year),
      dueDate: resolvedDueDate,
      status: "pending",
      paymentMethod: paymentMethod || null,
    });

    return NextResponse.json({ message: "Fee record created successfully", id: fee._id });
  } catch (error) {
    console.error("POST /api/fees error:", error);
    return NextResponse.json({ error: "Failed to create fee record" }, { status: 500 });
  }
}
