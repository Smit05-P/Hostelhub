import { markAllNotificationsAsRead } from "@/lib/firestore";
import { NextResponse } from "next/server";

export async function PUT(request) {
  try {
    const data = await request.json();
    const { hostelId, userId, role } = data;

    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }

    await markAllNotificationsAsRead({ hostelId, userId, role });
    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("PUT /api/notifications/read-all error:", error);
    return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
  }
}
