import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { roomService } from "@/services/server/roomService";

export async function GET(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const room = await roomService.getRoomById(id);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("GET Room Error:", error);
    return NextResponse.json({ error: "Failed to fetch room details" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    
    // Map price to rent if present in updates
    if (data.price) {
      data.rent = parseFloat(data.price);
      delete data.price;
    }

    await roomService.updateRoom(id, data);
    return NextResponse.json({ message: "Room updated successfully" });
  } catch (error) {
    console.error("PUT Room Error:", error);
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await roomService.deleteRoom(id);
    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("DELETE Room Error:", error);
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}
