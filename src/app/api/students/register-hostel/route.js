import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Hostel from "@/models/Hostel";

/**
 * PATCH /api/students/register-hostel
 * Body: { studentId, hostelId }
 * Registers a student to a chosen hostel.
 */
export async function PATCH(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, hostelId } = await request.json();

    if (!studentId || !hostelId) {
      return NextResponse.json(
        { error: "studentId and hostelId are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Validate the student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    // Validate the hostel exists
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }

    // Update student document
    student.hostelId = hostelId;
    await student.save();

    return NextResponse.json({
      success: true,
      hostelId,
      hostelName: hostel.name,
    });
  } catch (error) {
    console.error("PATCH /api/students/register-hostel error:", error);
    return NextResponse.json(
      { error: "Failed to register student to hostel." },
      { status: 500 }
    );
  }
}
