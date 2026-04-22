import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Room from "@/models/Room";
import Fee from "@/models/Fee";
import { computeFeeStatus } from "@/lib/utils/fee";

// GET /api/reports/students — Full joined student report scoped to hostelId
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hostelId = session.hostelId || searchParams.get("hostelId");

    if (!hostelId) {
      return NextResponse.json(
        { error: "Context (hostelId) is required." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Fetch students, rooms, and fees in parallel
    const [students, rooms, fees] = await Promise.all([
      Student.find({ hostelId }),
      Room.find({ hostelId }),
      Fee.find({ hostelId })
    ]);

    // Build lookup maps
    const roomsMap = {};
    rooms.forEach((r) => {
      roomsMap[r._id.toString()] = r;
    });

    // Group fees by studentId
    const feesMap = {};
    fees.forEach((f) => {
      const sid = f.studentId.toString();
      if (!feesMap[sid]) feesMap[sid] = [];
      feesMap[sid].push(f);
    });

    // Build report rows
    const rows = students.map((s) => {
      const roomId = s.assignedRoomId?.toString();
      const room = roomId ? roomsMap[roomId] || null : null;
      const studentFees = feesMap[s._id.toString()] || [];

      // Calculate totals across all fees for this student
      let monthlyFee = room?.price || 0;
      let amountPaid = 0;
      let amountPending = 0;

      studentFees.forEach((fee) => {
        const status = computeFeeStatus(fee);
        const amount = parseFloat(fee.amount) || 0;
        if (status === "Paid") {
          amountPaid += amount;
        } else {
          amountPending += amount;
        }
        // Use fee amount for monthly fee if not already set from room
        if (!monthlyFee && amount) monthlyFee = amount;
      });

      // Latest fee for payment status
      const sortedFees = [...studentFees].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const latestFee = sortedFees[0];
      const paymentStatus = latestFee ? computeFeeStatus(latestFee) : "N/A";

      // Days calculation
      const joinedDate = s.joiningDate || s.createdAt;
      let duration = null;
      let daysRemaining = null;

      if (joinedDate && !isNaN(new Date(joinedDate))) {
        const now = new Date();
        const durationMap = { "6M": 6, "1Y": 12, "2Y": 24, "3Y": 36, "4Y": 48 };
        const stayDurationMonths = durationMap[s.duration] || parseInt(s.duration) || 12;
        
        let termEndDate;
        if (s.termEndDate) {
          termEndDate = new Date(s.termEndDate);
        } else {
          termEndDate = new Date(joinedDate);
          termEndDate.setMonth(termEndDate.getMonth() + stayDurationMonths);
        }

        const durationMs = termEndDate - new Date(joinedDate);
        duration = Math.max(0, Math.floor(durationMs / (1000 * 60 * 60 * 24)));

        const diffRemaining = termEndDate - now;
        daysRemaining = Math.max(0, Math.floor(diffRemaining / (1000 * 60 * 60 * 24)));
      }

      return {
        id: s._id,
        name: s.name || "",
        mobile: s.phone || "",
        email: s.email || "",
        roomNumber: room?.roomNumber || "Unassigned",
        roomType: room?.roomType || "N/A",
        fieldOfStudy: s.fieldOfStudy || "",
        collegeName: s.collegeName || "",
        checkInDate: joinedDate ? new Date(joinedDate).toLocaleDateString() : null,
        duration,
        daysRemaining,
        monthlyFee,
        amountPaid: Math.round(amountPaid),
        amountPending: Math.round(amountPending),
        paymentStatus,
        status: s.status || "Active",
      };
    });

    // Sort by name
    rows.sort((a, b) => a.name.localeCompare(b.name));

    // Summary stats
    const totalStudents = rows.length;
    const totalCollected = rows.reduce((acc, r) => acc + r.amountPaid, 0);
    const totalPending = rows.reduce((acc, r) => acc + r.amountPending, 0);
    const activeStudents = rows.filter((r) => r.status === "Active").length;

    return NextResponse.json({
      rows,
      summary: { totalStudents, totalCollected, totalPending, activeStudents },
    });
  } catch (error) {
    console.error("GET /api/reports/students error:", error);
    return NextResponse.json(
      { error: "Failed to generate student report.", detail: error.message },
      { status: 500 }
    );
  }
}
