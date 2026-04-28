import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Fee from "@/models/Fee";
import Student from "@/models/Student";
import Hostel from "@/models/Hostel";
import Room from "@/models/Room";

// GET /api/admin/fees - Dynamically generate and fetch all fees and stats
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hostelId = session.hostelId || searchParams.get("hostelId");

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    await dbConnect();

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // 1. Dynamic Fee Generation
    // Fetch all active students in this hostel
    const activeStudents = await Student.find({
      hostelId,
      status: 'Active',
      hostelStatus: 'Approved'
    }).populate('roomId').lean();

    // Find existing fees for this month
    const existingFees = await Fee.find({
      hostelId,
      month: currentMonth,
      year: currentYear
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

        if (!amount && student.roomId && student.roomId.rent) {
            amount = student.roomId.rent;
        }
        if (!amount) amount = 0; // fallback

        // Default Due Date: 5th of next month (or current month if setting is past)
        const dueDate = new Date(currentYear, currentMonth - 1, 5); 
        
        feesToCreate.push({
          studentId: student._id,
          studentName: student.name,
          roomId: student.roomId ? student.roomId._id : null,
          roomNumber: student.roomId ? student.roomId.roomNumber : "",
          hostelId,
          amount,
          month: currentMonth,
          year: currentYear,
          dueDate,
          status: 'pending'
        });
      }
    }

    if (feesToCreate.length > 0) {
      await Fee.insertMany(feesToCreate);
    }

    // FIX FOR $0 PENDING FEES: Try to heal any existing $0 pending fees
    const pendingZeroFees = await Fee.find({ hostelId, status: 'pending', amount: 0 }).populate('studentId');
    if (pendingZeroFees.length > 0) {
      for (const fee of pendingZeroFees) {
        // studentId is already populated from the query above
        const student = await Student.findById(fee.studentId._id || fee.studentId).populate('roomId');
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

          if (correctedAmount > 0) {
            fee.amount = correctedAmount;
            await fee.save();
          }
        }
      }
    }

    // 2. Fetch all fees for UI
    const allFees = await Fee.find({ hostelId })
      .populate('studentId', 'name email profileImage')
      .sort({ createdAt: -1 })
      .lean();

    // 3. Map for UI and Calculate Stats
    let totalCollected = 0;
    let totalPending = 0;
    let monthRevenue = 0;

    const formattedPayments = allFees.map(f => {
      const statusLower = (f.status || "").toLowerCase();
      if (statusLower === 'paid') {
        totalCollected += f.amount;
        if (f.month === currentMonth && f.year === currentYear) {
           monthRevenue += f.amount;
        }
      } else if (statusLower === 'pending' || statusLower === 'overdue') {
        totalPending += f.amount;
      }

      return {
        id: f._id,
        studentName: f.studentId?.name || f.studentName || "Unknown",
        email: f.studentId?.email || "No email",
        profileImage: f.studentId?.profileImage || null,
        amount: f.amount,
        status: statusLower.charAt(0).toUpperCase() + statusLower.slice(1),
        date: f.createdAt,
        month: f.month,
        year: f.year,
        paymentMethod: f.paymentMethod || null
      };
    });

    return NextResponse.json({
      payments: formattedPayments,
      stats: {
        totalCollected,
        totalPending,
        monthRevenue
      }
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });

  } catch (error) {
    console.error("GET /api/admin/fees error:", error);
    return NextResponse.json({
      error: "Failed to fetch ledger",
      detail: error.message
    }, { status: 500 });
  }
}

// POST /api/admin/fees - Set fee amount for all active students for current cycle
export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const hostelId = body?.hostelId || session.hostelId;
    const amount = Number(body?.amount);

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "A valid positive amount is required." }, { status: 400 });
    }

    await dbConnect();

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const hostel = await Hostel.findById(hostelId).lean();
    const dueDayRaw = Number(hostel?.settings?.rentDueDay);
    const dueDay = Number.isFinite(dueDayRaw) ? Math.min(28, Math.max(1, dueDayRaw)) : 5;
    const dueDate = new Date(currentYear, currentMonth - 1, dueDay);

    const activeStudents = await Student.find({
      hostelId,
      status: 'Active',
      hostelStatus: 'Approved'
    }).populate('roomId').lean();

    if (activeStudents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active students found for this hostel.",
        updatedStudents: 0
      });
    }

    // Persist base monthly fee on student record so future cycles remain consistent.
    await Student.updateMany(
      { hostelId, status: 'Active', hostelStatus: 'Approved' },
      { $set: { rentAmount: amount } }
    );

    // Keep paid invoices immutable. Update/create only non-paid current-cycle records.
    const paidFees = await Fee.find({
      hostelId,
      month: currentMonth,
      year: currentYear,
      status: { $regex: /^paid$/i }
    }).select('studentId').lean();

    const paidStudentIds = new Set(paidFees.map((f) => String(f.studentId)));
    const studentsToUpdate = activeStudents.filter((s) => !paidStudentIds.has(String(s._id)));

    if (studentsToUpdate.length > 0) {
      const bulkOps = studentsToUpdate.map((student) => ({
        updateOne: {
          filter: {
            hostelId,
            studentId: student._id,
            month: currentMonth,
            year: currentYear,
            status: { $not: /^paid$/i },
          },
          update: {
            $set: {
              studentName: student.name || "",
              roomId: student.roomId?._id || null,
              roomNumber: student.roomId?.roomNumber || "",
              amount,
              dueDate,
              status: "Pending",
            },
            $setOnInsert: {
              hostelId,
              studentId: student._id,
              month: currentMonth,
              year: currentYear,
            }
          },
          upsert: true
        }
      }));

      await Fee.bulkWrite(bulkOps, { ordered: false });
    }

    return NextResponse.json({
      success: true,
      message: "Fees set successfully for active students.",
      updatedStudents: studentsToUpdate.length,
      skippedPaidInvoices: paidStudentIds.size,
      amount,
      month: currentMonth,
      year: currentYear,
    });
  } catch (error) {
    console.error("POST /api/admin/fees error:", error);
    return NextResponse.json({
      error: "Failed to set fees for all students",
      detail: error.message
    }, { status: 500 });
  }
}
