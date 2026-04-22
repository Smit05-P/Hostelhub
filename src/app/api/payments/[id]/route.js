import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";

export async function DELETE(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    await dbConnect();
    const payment = await Payment.findByIdAndDelete(id);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    console.error("DELETE Payment Error:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
