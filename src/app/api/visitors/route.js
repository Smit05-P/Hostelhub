import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Visitor from "@/models/Visitor";
import mongoose from "mongoose";

// GET /api/visitors - Fetch visitor records
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const requestedHostelId = searchParams.get("hostelId");
    const hostelId = requestedHostelId || session.hostelId;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    await dbConnect();
    const hostelIdFilters = [hostelId];
    if (mongoose.Types.ObjectId.isValid(hostelId)) {
      hostelIdFilters.push(new mongoose.Types.ObjectId(hostelId));
    }

    let query = { hostelId: { $in: hostelIdFilters } };
    
    // If studentId is provided, filter by it but also include general hostel guests
    if (studentId) {
      try {
        const sId = new mongoose.Types.ObjectId(studentId);
        query = {
          hostelId: { $in: hostelIdFilters },
          $or: [
            { studentId: sId },
            { studentId: { $exists: false } },
            { studentId: null }
          ]
        };
      } catch (e) {
        // Fallback for non-ObjectId strings if any
        query = {
          hostelId: { $in: hostelIdFilters },
          $or: [
            { studentId: studentId },
            { studentId: { $exists: false } },
            { studentId: null }
          ]
        };
      }
    }

    const visitors = await Visitor.find(query).sort({ createdAt: -1 });
    return NextResponse.json(visitors);
  } catch (error) {
    console.error("GET /api/visitors error:", error);
    return NextResponse.json({ error: "Failed to fetch visitors" }, { status: 500 });
  }
}

// POST /api/visitors - Create a new visitor request (Student) or direct log (Admin)
export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    await dbConnect();

    // Determine status: Admin creates direct completed entries, Student requests start as pending
    const status = session.role === 'admin' ? (data.status || 'Completed') : 'Pending';

    const visitor = await Visitor.create({
      ...data,
      hostelId: data.hostelId || session.hostelId,
      status
    });

    return NextResponse.json(visitor);
  } catch (error) {
    console.error("POST /api/visitors error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}
