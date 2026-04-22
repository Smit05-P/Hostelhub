import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Room from "@/models/Room";
import Allocation from "@/models/Allocation";

export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, roomId } = await request.json();

    if (!studentId || !roomId) {
      return NextResponse.json({ error: "studentId and roomId are required" }, { status: 400 });
    }

    await dbConnect();

    // 1. Update active allocations to ended
    await Allocation.updateMany(
      { studentId, roomId, status: 'active' },
      { status: 'ended', deallocatedAt: new Date() }
    );

    // 2. Clear Student room
    await Student.findByIdAndUpdate(studentId, {
      $unset: { roomId: "" }
    });

    // 3. Update Room (remove occupancy)
    await Room.findByIdAndUpdate(roomId, {
      $pull: { occupants: studentId }
    });

    return NextResponse.json({ message: "Student deallocated successfully" });
  } catch (error) {
    console.error("POST /api/rooms/deallocate error:", error);
    return NextResponse.json({ error: "Deallocation failed" }, { status: 500 });
  }
}
