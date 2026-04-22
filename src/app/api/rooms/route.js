import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { roomService } from "@/services/server/roomService";

// GET /api/rooms — Fetch all rooms
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hostelId = session.hostelId || searchParams.get("hostelId");

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const rooms = await roomService.getRooms(hostelId);
    return NextResponse.json(rooms, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/rooms error:", error);
    return NextResponse.json({ error: "Failed to fetch rooms." }, { status: 500 });
  }
}

// POST /api/rooms — Create a new room
export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { roomNumber, floor, capacity, type, status, price, amenities } = data;

    if (!roomNumber || !capacity) {
      return NextResponse.json({ error: "roomNumber and capacity are required" }, { status: 400 });
    }

    const hostelId = session.hostelId || data.hostelId;

    if (!hostelId) {
      return NextResponse.json({ error: "Hostel ID context missing. Please relogin." }, { status: 400 });
    }

    // Map frontend types to model enum ['single', 'double', 'triple', 'four', 'other']
    let mappedType = type?.toLowerCase();
    if (mappedType === "standard" || !mappedType) {
      mappedType = parseInt(capacity) === 1 ? "single" : "double";
    }

    const room = await roomService.createRoom({
      roomNumber: roomNumber.toString(),
      floor: floor || "",
      capacity: parseInt(capacity),
      type: mappedType,
      status: status?.toLowerCase() || "available",
      rent: parseFloat(price) || 0,
      amenities: amenities || [],
      hostelId
    });

    return NextResponse.json({ message: "Room created successfully", id: room._id });
  } catch (error) {
    console.error("CRITICAL: POST /api/rooms error details:", {
      message: error.message,
      stack: error.stack,
      errors: error.errors // Mongoose validation errors
    });
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return NextResponse.json({ error: `Validation Error: ${messages.join(', ')}` }, { status: 400 });
    }

    if (error.code === 11000) {
      return NextResponse.json({ error: "Duplicate Error: A room with this number already exists in this hostel." }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error: Failed to create room asset." }, { status: 500 });
  }
}
