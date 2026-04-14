import { getAllFees, markFeeAsPaid } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/fees — Fetch all fees with optional filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const month = searchParams.get("month") || undefined;
    const year = searchParams.get("year") || undefined;
    const status = searchParams.get("status") || undefined;

    const cookieStore = await cookies();
    const hostelId = 
      request.headers.get("x-hostel-id") || 
      searchParams.get("hostelId") || 
      cookieStore.get("hostel-id")?.value;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const fees = await getAllFees({ hostelId, studentId, month, year, status });
    return NextResponse.json(fees);
  } catch (error) {
    console.error("GET /api/fees error:", error);
    return NextResponse.json({ error: "Failed to fetch fees" }, { status: 500 });
  }
}

// POST /api/fees — Manually create a fee record (admin override)
export async function POST(request) {
  try {
    let data;
    try {
      data = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Request body is required and must be valid JSON" }, { status: 400 });
    }

    const { studentId, studentName, roomId, roomNumber, amount, month, year, paymentMethod } = data;

    if (!studentId || !amount || !month || !year) {
      return NextResponse.json({ error: "studentId, amount, month, and year are required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const hostelId = 
      request.headers.get("x-hostel-id") || 
      data.hostelId || 
      cookieStore.get("hostel-id")?.value;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const today = new Date();
    const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(today.getFullYear(), today.getMonth() + 1, 5); // Default to 5th of next month

    const docRef = await addDoc(collection(db, "fees"), {
      studentId,
      studentName: studentName || "",
      roomId: roomId || null,
      roomNumber: roomNumber || "",
      hostelId,
      amount: parseFloat(amount),
      month: parseInt(month),
      year: parseInt(year),
      dueDate: Timestamp.fromDate(dueDate),
      status: "Pending",
      paidAt: null,
      paymentMethod: paymentMethod || null,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ message: "Fee record created successfully", id: docRef.id });
  } catch (error) {
    console.error("POST /api/fees error:", error);
    return NextResponse.json({ error: "Failed to create fee record" }, { status: 500 });
  }
}
