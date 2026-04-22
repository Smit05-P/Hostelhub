import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { studentService } from "@/services/server/studentService";

// GET /api/students/[id] — Fetch single student by ID
export async function GET(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const student = await studentService.getStudentById(id);
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    
    return NextResponse.json(student, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/students/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}

// PUT /api/students/[id] — Update student profile
export async function PUT(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    let data = await request.json();

    // Field Guard: Protected markers are read-only from profile/protocol edit paths.
    const immutableMarkerFields = [
      'enrollmentId', 'duration', 'arrivalDate', 'rentAmount', 'termEndDate', 'daysLeft'
    ];
    immutableMarkerFields.forEach((field) => {
      if (field in data) delete data[field];
    });

    // Additional student restrictions
    if (session.role === 'student') {
      const studentRestrictedFields = ['status', 'roomId', 'hostelId', 'lastUpdated'];
      studentRestrictedFields.forEach((field) => {
        if (field in data) delete data[field];
      });
    }

    const student = await studentService.updateStudent(id, data);
    
    return NextResponse.json({ 
      message: "Student updated successfully",
      student 
    });
  } catch (error) {
    console.error("PUT /api/students/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update student" }, { status: 500 });
  }
}

// DELETE /api/students/[id] — Delete student
export async function DELETE(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const success = await studentService.deleteStudent(id);
    
    if (!success) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/students/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
