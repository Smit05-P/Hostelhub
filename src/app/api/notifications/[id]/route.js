import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { notificationService } from "@/services/server/notificationService";

export async function PUT(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await notificationService.markAsRead(id);
    return NextResponse.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("PUT /api/notifications/[id] error:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await notificationService.deleteNotification(id);
    return NextResponse.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("DELETE /api/notifications/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
