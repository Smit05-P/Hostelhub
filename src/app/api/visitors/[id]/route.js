import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Visitor from "@/models/Visitor";

// PATCH /api/visitors/[id] - Update visitor status or details
export async function PATCH(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    await dbConnect();

    // Specific logic for check-in/out
    if (data.status === 'Checked-In') {
      data.checkInTime = new Date();
    } else if (data.status === 'Completed') {
      data.checkOutTime = new Date();
    }

    const visitor = await Visitor.findByIdAndUpdate(id, data, { new: true });
    
    if (!visitor) {
      return NextResponse.json({ error: "Visitor record not found" }, { status: 404 });
    }

    return NextResponse.json(visitor);
  } catch (error) {
    console.error("PATCH /api/visitors/[id] error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// PUT /api/visitors/[id] - Full edit (Student editing their request)
export async function PUT(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    await dbConnect();
    const visitor = await Visitor.findOneAndUpdate(
      { _id: id, studentId: session.userId }, // Ensure only owner can edit
      data,
      { new: true }
    );

    if (!visitor) {
      return NextResponse.json({ error: "Access denied or record missing" }, { status: 403 });
    }

    return NextResponse.json(visitor);
  } catch (error) {
    console.error("PUT /api/visitors/[id] error:", error);
    return NextResponse.json({ error: "Edit failed" }, { status: 500 });
  }
}

// DELETE /api/visitors/[id]
export async function DELETE(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    await Visitor.findByIdAndDelete(id);

    return NextResponse.json({ message: "Record purged successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
