import { getAllRooms, createRoom } from "@/lib/firestore";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/rooms — Fetch all rooms with optional status filter
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get("all") !== "false"; // default: include all
    
    const cookieStore = await cookies();
    
    // Prioritize header (injected by middleware) -> searchParam -> cookie
    const hostelId = 
      request.headers.get("x-hostel-id") || 
      searchParams.get("hostelId") || 
      cookieStore.get("hostel-id")?.value;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const rooms = await getAllRooms({ hostelId, includeAll });
    return NextResponse.json(rooms, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("GET /api/rooms error:", error);
    const message = error.code === "permission-denied" 
      ? "Security Protocol Violation: Access denied by cloud rules." 
      : "Synchronization Failure: Ensure valid composite indexing for scoped queries.";
    return NextResponse.json({ error: message, detail: error.message }, { status: 500 });
  }
}

// POST /api/rooms — Create a new room
export async function POST(request) {
  try {
    const data = await request.json();
    const { roomNumber, floor, capacity, type, status, price, amenities } = data;

    if (!roomNumber || !capacity) {
      return NextResponse.json({ error: "roomNumber and capacity are required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const hostelId = 
      request.headers.get("x-hostel-id") || 
      data.hostelId || 
      cookieStore.get("hostel-id")?.value || 
      "primary-hostel";

    const id = await createRoom({
      roomNumber: roomNumber.toString(),
      floor: floor || "",
      capacity: parseInt(capacity),
      type: type || "Standard",
      status: status || "Available",
      price: parseFloat(price) || 0,
      hostelId
    });

    return NextResponse.json({ message: "Room created successfully", id });
  } catch (error) {
    console.error("POST /api/rooms error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
