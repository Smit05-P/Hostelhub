import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notice from "@/models/Notice";

// PUT /api/notices/[id] - Update a notice
export async function PUT(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, description, priority } = await request.json();

    if (!id || !title || !description) {
      return NextResponse.json({ error: "ID, title, and description are required" }, { status: 400 });
    }

    await dbConnect();

    const notice = await Notice.findByIdAndUpdate(id, {
      title,
      description,
      priority: priority || 'medium',
    }, { new: true });

    if (!notice) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Notice updated successfully", notice });
  } catch (error) {
    console.error("PUT Notice Error:", error);
    return NextResponse.json({ error: "Failed to update notice" }, { status: 500 });
  }
}

// DELETE /api/notices/[id] - Delete a notice
export async function DELETE(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
       return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await dbConnect();
    const notice = await Notice.findByIdAndDelete(id);

    if (!notice) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("DELETE Notice Error:", error);
    return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 });
  }
}
