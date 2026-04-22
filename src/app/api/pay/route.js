import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Fee from "@/models/Fee";
import Payment from "@/models/Payment";

export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { feeId, studentId, studentName, amount, method, durationMonths } = data;

    if (!feeId || !studentId || amount === undefined || amount === null || !method) {
      return NextResponse.json({ error: "Missing required payment fields." }, { status: 400 });
    }

    await dbConnect();

    // 1. Find the initial fee record and validate
    const initialFee = await Fee.findById(feeId);
    if (!initialFee) {
      return NextResponse.json({ error: "Fee record not found." }, { status: 404 });
    }
    if (initialFee.status?.toLowerCase() === "paid") {
      return NextResponse.json({ error: "Initial fee is already paid." }, { status: 409 });
    }

    const duration = parseInt(durationMonths || 1);
    const monthlyAmount = parseFloat(amount || initialFee.amount || 0);
    const totalAmount = monthlyAmount * duration;

    // 2. Determine payment method for record
    const paymentMethod = method || "online";
    const methodLower = paymentMethod.toLowerCase();
    
    // 3. Generate a unique reference ID
    const reference = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // 4. Update/Create fee records for the duration
    const feeIds = [feeId];
    
    // Update the initial fee
    initialFee.status = "Paid";
    initialFee.paidAt = new Date();
    initialFee.paymentMethod = method;
    initialFee.transactionId = reference;
    await initialFee.save();

    // If duration > 1, handle subsequent months
    if (duration > 1) {
      let currentMonth = initialFee.month;
      let currentYear = initialFee.year;

      for (let i = 1; i < duration; i++) {
        // Calculate next month/year
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }

        // Find existing fee for this month or create new one
        let nextFee = await Fee.findOne({
          studentId,
          month: currentMonth,
          year: currentYear,
          hostelId: initialFee.hostelId
        });

        if (nextFee) {
          nextFee.status = "Paid";
          nextFee.paidAt = new Date();
          nextFee.paymentMethod = method;
          nextFee.transactionId = reference;
          await nextFee.save();
          feeIds.push(nextFee._id);
        } else {
          // Create a new paid fee record
          const newFee = await Fee.create({
            studentId,
            studentName: initialFee.studentName,
            roomId: initialFee.roomId,
            roomNumber: initialFee.roomNumber,
            hostelId: initialFee.hostelId,
            amount: monthlyAmount,
            month: currentMonth,
            year: currentYear,
            dueDate: new Date(currentYear, currentMonth - 1, 5),
            status: "Paid",
            paidAt: new Date(),
            paymentMethod: method,
            transactionId: reference
          });
          feeIds.push(newFee._id);
        }
      }
    }

    // 5. Create a single Payment transaction record for the total amount
    const payment = await Payment.create({
      studentId,
      hostelId: initialFee.hostelId,
      amount: totalAmount,
      type: "rent",
      method: paymentMethod,
      status: "Paid",
      month: duration > 1 
        ? `${initialFee.month}/${initialFee.year} - ${((initialFee.month + duration - 2) % 12) + 1}/${initialFee.year + Math.floor((initialFee.month + duration - 2) / 12)}`
        : `${initialFee.month}/${initialFee.year}`,
      transactionId: reference,
      remarks: `Paid for ${duration} month(s) starting from ${initialFee.month}/${initialFee.year}. Total Fees covered: ${feeIds.length}`,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed payment for ${duration} month(s).`,
      transactionId: payment._id,
      reference,
      totalAmount
    });
  } catch (error) {
    console.error("POST /api/pay error:", error);
    return NextResponse.json({ error: error.message || "Payment failed." }, { status: 500 });
  }
}
