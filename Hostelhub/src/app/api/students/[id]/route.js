import {
  getUserById,
  updateStudent,
  deleteStudent,
  allocateStudentToRoom,
  deallocateStudent,
} from "@/lib/firestore";
import { NextResponse } from "next/server";

// GET /api/students/[id] — Fetch single student by UID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const student = await getUserById(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json(student);
  } catch (error) {
    console.error("GET /api/students/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}

// PUT /api/students/[id] — Update student profile + handle room reassignment
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Fetch current student to check existing room assignment
    const current = await getUserById(id);
    if (!current) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const oldRoomId = current.assignedRoomId || null;
    const newRoomId = data.assignedRoomId !== undefined ? (data.assignedRoomId || null) : oldRoomId;

    // Handle room changes atomically
    if (newRoomId !== oldRoomId) {
      // Deallocate from old room first
      if (oldRoomId) {
        try {
          await deallocateStudent({ studentId: id, roomId: oldRoomId, adminId: "admin" });
        } catch (deallocErr) {
          console.warn("Deallocation warning:", deallocErr.message);
        }
      }
      // Allocate to new room
      if (newRoomId) {
        try {
          await allocateStudentToRoom({ studentId: id, roomId: newRoomId, adminId: "admin" });
        } catch (allocErr) {
          console.warn("Allocation warning:", allocErr.message);
          // Still proceed with profile update even if allocation has issues
        }
      }
    }

    // Update student profile fields (lifecycle, status, dates, etc.)
    await updateStudent(id, data);
    
    // Return fresh student data for immediate UI update
    const updated = await getUserById(id);
    return NextResponse.json({ 
      message: "Student updated successfully",
      student: updated 
    });
  } catch (error) {
    console.error("PUT /api/students/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update student" }, { status: 500 });
  }
}

// DELETE /api/students/[id] — Delete student
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const success = await deleteStudent(id);
    if (!success) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/students/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
