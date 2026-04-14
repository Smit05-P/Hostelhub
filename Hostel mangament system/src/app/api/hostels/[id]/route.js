import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export async function PATCH(request, { params }) {
  try {
    const hostelId = params.id;
    const body = await request.json();

    const allowedUpdates = ["autoApprove", "status", "hostelName", "address", "contactNumber"];
    const updates = { updatedAt: serverTimestamp() };
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const hostelRef = doc(db, "hostels", hostelId);
    await updateDoc(hostelRef, updates);

    return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error("PATCH /api/hostels/[id] error:", error);
    return NextResponse.json({ error: "Failed to update hostel" }, { status: 500 });
  }
}
