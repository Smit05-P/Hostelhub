import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

/**
 * PATCH /api/students/register-hostel
 * Body: { studentId, hostelId }
 * Registers a student (who has no hostelId yet) to a chosen hostel.
 */
export async function PATCH(request) {
  try {
    const { studentId, hostelId } = await request.json();

    if (!studentId || !hostelId) {
      return NextResponse.json(
        { error: "studentId and hostelId are required." },
        { status: 400 }
      );
    }

    // Validate the student exists
    const studentRef = doc(db, "users", studentId);
    const studentSnap = await getDoc(studentRef);
    if (!studentSnap.exists()) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    // Validate the hostel exists
    const hostelRef = doc(db, "hostels", hostelId);
    const hostelSnap = await getDoc(hostelRef);
    if (!hostelSnap.exists()) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }

    // Prevent re-registration if already assigned
    const existing = studentSnap.data().hostelId;
    if (existing && existing !== "primary-hostel") {
      return NextResponse.json(
        { error: "Student is already registered to a hostel." },
        { status: 409 }
      );
    }

    // Update student document
    await updateDoc(studentRef, {
      hostelId,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      hostelId,
      hostelName: hostelSnap.data().hostelName,
    });
  } catch (error) {
    console.error("PATCH /api/students/register-hostel error:", error);
    return NextResponse.json(
      { error: "Failed to register student to hostel." },
      { status: 500 }
    );
  }
}
