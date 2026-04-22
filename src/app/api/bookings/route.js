import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";

// GET /api/bookings - Fetch all bookings
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    
    await dbConnect();
    
    let query = {};
    if (studentId) {
      query.studentId = studentId;
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('studentId')
      .populate('roomId');

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("GET Bookings Error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { studentId, roomId, studentName, roomNumber, startDate, endDate, status } = data;

    if (!studentId || !roomId) {
      return NextResponse.json({ error: "Student and Room IDs are required" }, { status: 400 });
    }

    await dbConnect();

    const booking = await Booking.create({
      studentId,
      roomId,
      studentName: studentName || "",
      roomNumber: roomNumber || "",
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || 'Pending',
    });

    return NextResponse.json({ message: "Booking created successfully", booking });
  } catch (error) {
    console.error("POST Booking Error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
