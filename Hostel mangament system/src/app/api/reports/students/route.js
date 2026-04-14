import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { computeFeeStatus } from "@/lib/firestore";

// GET /api/reports/students — Full joined student report scoped to hostelId
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cookieStore = await cookies();
    const hostelId =
      request.headers.get("x-hostel-id") ||
      searchParams.get("hostelId") ||
      cookieStore.get("hostel-id")?.value;

    if (!hostelId) {
      return NextResponse.json(
        { error: "Context (hostelId) is required." },
        { status: 400 }
      );
    }

    // Fetch students, rooms, and fees in parallel
    const [studentsSnap, roomsSnap, feesSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "student"),
          where("hostelId", "==", hostelId)
        )
      ),
      getDocs(query(collection(db, "rooms"), where("hostelId", "==", hostelId))),
      getDocs(query(collection(db, "fees"), where("hostelId", "==", hostelId))),
    ]);

    // Build lookup maps
    const roomsMap = {};
    roomsSnap.docs.forEach((d) => {
      roomsMap[d.id] = { id: d.id, ...d.data() };
    });

    // Group fees by studentId — pick the latest/most relevant fee
    const feesMap = {};
    feesSnap.docs.forEach((d) => {
      const fee = { id: d.id, ...d.data() };
      const sid = fee.studentId;
      if (!feesMap[sid]) feesMap[sid] = [];
      feesMap[sid].push(fee);
    });

    // Build report rows
    const rows = studentsSnap.docs.map((d) => {
      const s = { id: d.id, ...d.data() };
      const room = s.assignedRoomId ? roomsMap[s.assignedRoomId] || null : null;
      const studentFees = feesMap[s.id] || [];

      // Calculate totals across all fees for this student
      let monthlyFee = room?.price || 0;
      let amountPaid = 0;
      let amountPending = 0;

      studentFees.forEach((fee) => {
        const status = computeFeeStatus({
          ...fee,
          dueDate: fee.dueDate,
        });
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
        (a, b) =>
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
      );
      const latestFee = sortedFees[0];
      const paymentStatus = latestFee
        ? computeFeeStatus({
            ...latestFee,
            dueDate: latestFee.dueDate,
          })
        : "N/A";

      // Days calculation
      const joinedDate = s.joiningDate
        ? new Date(s.joiningDate)
        : s.createdAt?.toDate?.()
        ? s.createdAt.toDate()
        : null;

      let duration = null;
      let daysRemaining = null;

      if (joinedDate && !isNaN(joinedDate)) {
        const now = new Date();
        const stayDurationMonths = parseInt(s.stayDuration) || 12; // default 1 year fallback
        
        let termEndDate;
        if (s.termEndDate) {
          termEndDate = new Date(s.termEndDate.toDate ? s.termEndDate.toDate() : s.termEndDate);
        } else {
          // Construct if missing structurally
          termEndDate = new Date(joinedDate);
          termEndDate.setMonth(termEndDate.getMonth() + stayDurationMonths);
        }

        // Total duration is strictly bounds between arrival to term-end.
        const durationMs = termEndDate - joinedDate;
        duration = Math.max(0, Math.floor(durationMs / (1000 * 60 * 60 * 24)));

        // Days remaining is now to termEnd
        const diffRemaining = termEndDate - now;
        daysRemaining = Math.max(
          0,
          Math.floor(diffRemaining / (1000 * 60 * 60 * 24))
        );
      }

      return {
        id: s.id,
        name: s.name || "",
        mobile: s.phone || "",
        email: s.email || "",
        roomNumber: room?.roomNumber || "Unassigned",
        roomType: room?.type || room?.roomType || "N/A",
        fieldOfStudy: s.fieldOfStudy || s.course || "",
        collegeName: s.collegeName || s.college || "",
        checkInDate: s.joiningDate?.toDate?.()?.toLocaleDateString?.() || s.joiningDate || s.createdAt?.toDate?.()?.toISOString?.() || null,
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
    const totalCollected = rows.reduce((s, r) => s + r.amountPaid, 0);
    const totalPending = rows.reduce((s, r) => s + r.amountPending, 0);
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
