import { processPayment } from "@/lib/firestore";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const data = await request.json();
    const { feeId, studentId, studentName, amount, method, durationMonths } = data;

    if (!feeId || !studentId || !amount || !method) {
      return NextResponse.json({ error: "Missing required payment fields." }, { status: 400 });
    }

    // Generate a unique reference ID for simulation
    const reference = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const result = await processPayment(feeId, {
      studentId,
      studentName,
      amount,
      method,
      reference,
      durationMonths: durationMonths || 1
    });

    return NextResponse.json({ 
      success: true, 
      message: "Payment processed successfully.",
      transactionId: result.transactionId,
      reference
    });
  } catch (error) {
    console.error("POST /api/pay error:", error);
    return NextResponse.json({ error: error.message || "Payment failed." }, { status: 500 });
  }
}
