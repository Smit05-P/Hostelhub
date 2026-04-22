import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { notificationService } from "@/services/server/notificationService";

// GET /api/notifications - Fetch notifications for a user/hostel
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hostelId = session.hostelId || searchParams.get("hostelId");
    const userId = searchParams.get("userId") || session.userId;
    const role = searchParams.get("role") || session.role;

    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }

    const { notifications } = await notificationService.getNotifications({
      hostelId,
      recipientId: userId,
      recipientRole: role,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// DELETE /api/notifications - Clear notifications
export async function DELETE(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hostelId = session.hostelId || searchParams.get("hostelId");
    const userId = searchParams.get("userId") || session.userId;

    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }

    // Using query-based deletion if service supports it or direct model
    await notificationService.markAllAsRead({
      hostelId,
      recipientId: userId,
      recipientRole: session.role
    });

    return NextResponse.json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("DELETE /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to clear notifications" }, { status: 500 });
  }
}
