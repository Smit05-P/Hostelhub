import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { paymentService } from "@/services/server/paymentService";

// GET /api/payments - Fetch all payments scoped to active hostel
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const hostelId = session.hostelId || searchParams.get("hostelId");

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const { payments } = await paymentService.getPayments({
      hostelId,
      studentId,
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("GET Payments Error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch payments", 
      detail: error.message 
    }, { status: 500 });
  }
}

// POST /api/payments - Record a new payment
export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { studentId, amount, status, studentName, paymentMethod, paymentDate, type } = data;

    if (!studentId || !amount) {
      return NextResponse.json({ error: "Student ID and amount are required" }, { status: 400 });
    }

    const hostelId = session.hostelId || data.hostelId;

    const payment = await paymentService.createPayment({
      studentId,
      hostelId,
      amount: parseFloat(amount),
      status: status?.toLowerCase() || 'pending',
      type: type?.toLowerCase() || 'rent',
      paymentMethod: paymentMethod || "Online",
      date: paymentDate ? new Date(paymentDate) : new Date(),
    });

    // TODO: Implement Notification Service
    // For now, we skip notifications until Phase 4 operations

    return NextResponse.json({ message: "Payment recorded successfully", id: payment._id });
  } catch (error) {
    console.error("POST Payment Error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
