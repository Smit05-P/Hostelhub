import { getFeeById, markFeeAsPaid } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

// PATCH /api/fees/[id] — Mark fee as Paid or update status
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { action, paymentMethod } = await request.json();

    const fee = await getFeeById(id);
    if (!fee) {
      return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    }

    if (action === "mark_paid") {
      await markFeeAsPaid(id, { paymentMethod: paymentMethod || "Cash" });
      return NextResponse.json({ message: "Fee marked as paid" });
    }

    if (action === "mark_overdue") {
      const feeRef = doc(db, "fees", id);
      await updateDoc(feeRef, { status: "Overdue", updatedAt: serverTimestamp() });
      return NextResponse.json({ message: "Fee marked as overdue" });
    }

    return NextResponse.json({ error: "Invalid action. Use: mark_paid | mark_overdue" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/fees/[id] error:", error);
    return NextResponse.json({ error: "Failed to update fee" }, { status: 500 });
  }
}

// GET /api/fees/[id] — Fetch single fee record
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const fee = await getFeeById(id);
    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }
    return NextResponse.json(fee);
  } catch (error) {
    console.error("GET /api/fees/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch fee" }, { status: 500 });
  }
}
