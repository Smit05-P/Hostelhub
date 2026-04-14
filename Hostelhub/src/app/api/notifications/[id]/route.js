import { markNotificationAsRead, deleteNotification } from "@/lib/firestore";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await markNotificationAsRead(id);
    return NextResponse.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("PUT /api/notifications/[id] error:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await deleteNotification(id);
    return NextResponse.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("DELETE /api/notifications/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
