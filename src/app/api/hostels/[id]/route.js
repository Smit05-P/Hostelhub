import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Hostel from "@/models/Hostel";

export async function PATCH(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: hostelId } = await params;
    const body = await request.json();

    await dbConnect();

    const allowedUpdates = ["name", "address", "contactNumber", "autoApprove", "status", "settings"];
    const updates = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const hostel = await Hostel.findByIdAndUpdate(hostelId, updates, { new: true });
    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, hostel });
  } catch (error) {
    console.error("PATCH /api/hostels/[id] error:", error);
    return NextResponse.json({ error: "Failed to update hostel" }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { id: hostelId } = await params;
    await dbConnect();
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }
    return NextResponse.json(hostel);
  } catch (error) {
    console.error("GET /api/hostels/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch hostel" }, { status: 500 });
  }
}
