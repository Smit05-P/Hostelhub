import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  where
} from "firebase/firestore";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/payments - Fetch all payments scoped to active hostel
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    const cookieStore = await cookies();
    const hostelId =
      request.headers.get("x-hostel-id") ||
      searchParams.get("hostelId") ||
      cookieStore.get("hostel-id")?.value;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const paymentsCol = collection(db, "transactions");
    let q = query(paymentsCol, where("hostelId", "==", hostelId));

    if (studentId) {
      q = query(q, where("studentId", "==", studentId));
    }

    const querySnapshot = await getDocs(q);
    const payments = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.timestamp?.toDate()?.toISOString() || data.createdAt?.toDate()?.toISOString() || null
      }
    });

    // Sort in memory to avoid composite index requirement
    payments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return NextResponse.json(payments);
  } catch (error) {
    console.error("GET Payments Error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST /api/payments - Record a new payment
export async function POST(request) {
  try {
    const data = await request.json();
    const { studentId, amount, status, studentName, paymentMethod, paymentDate, hostelId } = data;

    if (!studentId || !amount) {
      return NextResponse.json({ error: "Student ID and amount are required" }, { status: 400 });
    }

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, "transactions"), {
      studentId,
      hostelId,
      amount: parseFloat(amount),
      status: status || 'Pending',
      studentName: studentName || "",
      paymentMethod: paymentMethod || "Online",
      paymentDate: paymentDate || null,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    try {
      const { createNotification } = await import("@/lib/firestore");
      // Notify Admin
      await createNotification({
        hostelId,
        recipientId: "admin_group",
        recipientRole: "admin",
        senderId: studentId,
        senderRole: "student",
        senderName: studentName || "A Student",
        type: "fee_paid",
        title: "💰 Payment Received",
        message: `${studentName || "A Resident"} just paid $${amount} via ${paymentMethod || "Online"}.`,
        actionUrl: "/admin/payments"
      });

      // Notify Student
      await createNotification({
        hostelId,
        recipientId: studentId,
        recipientRole: "student",
        senderId: "system",
        senderRole: "admin",
        type: "fee_paid",
        title: "Payment Confirmed ✅",
        message: `Your payment of $${amount} was successfully recorded.`,
        actionUrl: "/student/fees"
      });
    } catch(e) { console.error("Payment notification failed:", e) }

    return NextResponse.json({ message: "Payment recorded successfully", id: docRef.id });
  } catch (error) {
    console.error("POST Payment Error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
