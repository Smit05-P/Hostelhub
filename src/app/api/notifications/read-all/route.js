import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { notificationService } from "@/services/server/notificationService";

export async function PUT(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const hostelId = session.hostelId || data.hostelId;
    const userId = data.userId || session.userId;
    const role = data.role || session.role;

    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }

    await notificationService.markAllAsRead({
      hostelId,
      recipientId: userId,
      recipientRole: role,
    });

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("PUT /api/notifications/read-all error:", error);
    return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
  }
}
