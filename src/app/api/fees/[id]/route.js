import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Fee from "@/models/Fee";

// PATCH /api/fees/[id] — Mark fee as Paid or update status
export async function PATCH(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { id } = params;
    const { action, paymentMethod } = await request.json();

    await dbConnect();

    const fee = await Fee.findById(id);
    if (!fee) {
      return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    }

    if (action === "mark_paid") {
      fee.status = "Paid";
      fee.paidAt = new Date();
      fee.paymentMethod = paymentMethod || "Cash";
      await fee.save();
      return NextResponse.json({ message: "Fee marked as paid", fee });
    }

    if (action === "mark_overdue") {
      fee.status = "Overdue";
      await fee.save();
      return NextResponse.json({ message: "Fee marked as overdue", fee });
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
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    await dbConnect();
    const fee = await Fee.findById(id).populate('studentId').populate('roomId');
    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }
    return NextResponse.json(fee);
  } catch (error) {
    console.error("GET /api/fees/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch fee" }, { status: 500 });
  }
}
