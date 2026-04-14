import { getRoomById, updateRoom, deleteRoom } from "@/lib/firestore";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const room = await getRoomById(id);

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
    const { id } = await params;
    const data = await request.json();
    await updateRoom(id, data);
    return NextResponse.json({ message: "Room updated successfully" });
  } catch (error) {
    console.error("PUT Room Error:", error);
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await deleteRoom(id);
    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("DELETE Room Error:", error);
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}
