/**
 * GET /api/hostels/[id]/members
 * DELETE /api/hostels/[id]/members
 * 
 * GET: Get all members (students) of a hostel
 * DELETE: Remove a member from a hostel
 * 
 * Query Params (GET):
 * - status: Active | Inactive | all (optional, default: all)
 * 
 * Body (DELETE):
 * - studentId: string (required)
 */

import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";

export async function GET(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: hostelId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    await dbConnect();

    const query = { hostelId };
    if (status && status !== "all") {
      query.status = status;
    }

    const members = await Student.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, members },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/hostels/[id]/members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: hostelId } = await params;
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Remove hostel association from the student
    const student = await Student.findByIdAndUpdate(studentId, {
      $unset: { hostelId: 1, roomId: 1 },
      hostelStatus: "NO_HOSTEL",
    }, { new: true });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Member removed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/hostels/[id]/members error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
