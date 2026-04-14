import { allocateStudentToRoom, deallocateStudent, getAllFees } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/allocations — List all active allocations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "Active";
    
    // Extract context
    const cookieStore = await cookies();
    const hostelId = 
      request.headers.get("x-hostel-id") || 
      searchParams.get("hostelId") || 
      cookieStore.get("hostel-id")?.value;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    // SCOPED QUERY - Removed orderBy to avoid index requirement
    let q = query(collection(db, "allocations"), where("hostelId", "==", hostelId));
    
    if (status !== "all") {
      q = query(q, where("status", "==", status));
    }

    const snap = await getDocs(q);
    const allocations = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      allocatedAt: d.data().allocatedAt?.toDate?.()?.toISOString() || null,
      deallocatedAt: d.data().deallocatedAt?.toDate?.()?.toISOString() || null,
    }));

    // SORT IN-MEMORY
    allocations.sort((a, b) => new Date(b.allocatedAt || 0) - new Date(a.allocatedAt || 0));

    return NextResponse.json(allocations);
  } catch (error) {
    console.error("GET /api/allocations error:", error);
    return NextResponse.json({ error: "Failed to fetch allocations" }, { status: 500 });
  }
}

// POST /api/allocations — Atomically allocate a student to a room
// Also auto-generates a fee record for the current month
export async function POST(request) {
  try {
    const { studentId, roomId, adminId } = await request.json();

    if (!studentId || !roomId) {
      return NextResponse.json({ error: "studentId and roomId are required" }, { status: 400 });
    }

    const result = await allocateStudentToRoom({ studentId, roomId, adminId: adminId || "system" });

    // Try to notify the student
    try {
      // Need to extract hostelId from context since allocateStudentToRoom uses it internally
      const cookieStore = await cookies();
      const hostelId = request.headers.get("x-hostel-id") || cookieStore.get("hostel-id")?.value;
      if (hostelId) {
        // We need the createNotification import
        const { createNotification } = await import("@/lib/firestore");
        await createNotification({
          hostelId,
          recipientId: studentId,
          recipientRole: "student",
          senderId: adminId || "system",
          senderRole: "admin",
          senderName: "Administration",
          type: "room_allocated",
          title: "🏠 Room Allocated",
          message: "You have been fully assigned to a new room. Your fee cycle starts now.",
          actionUrl: "/student"
        });
      }
    } catch(e) { console.error("Notification trigger fail:", e); }

    return NextResponse.json({
      message: "Student allocated successfully. Monthly fee record created.",
      allocationId: result.allocationId,
    });
  } catch (error) {
    console.error("POST /api/allocations error:", error.message);
    return NextResponse.json({ error: error.message || "Allocation failed" }, { status: 400 });
  }
}

// DELETE /api/allocations — Deallocate a student from their current room
// Body: { studentId, roomId }
export async function DELETE(request) {
  try {
    const { studentId, roomId } = await request.json();

    if (!studentId || !roomId) {
      return NextResponse.json({ error: "studentId and roomId are required" }, { status: 400 });
    }

    await deallocateStudent({ studentId, roomId });

    // Archive any active allocation record (best effort, outside atomic transaction)
    try {
      const q = query(
        collection(db, "allocations"),
        where("studentId", "==", studentId),
        where("status", "==", "Active")
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await updateDoc(doc(db, "allocations", d.id), {
          status: "Ended",
          deallocatedAt: serverTimestamp(),
        });
      }
    } catch (archiveErr) {
      console.warn("Could not archive allocation record:", archiveErr.message);
    }

    return NextResponse.json({ message: "Student deallocated successfully" });
  } catch (error) {
    console.error("DELETE /api/allocations error:", error.message);
    return NextResponse.json({ error: error.message || "Deallocation failed" }, { status: 400 });
  }
}
