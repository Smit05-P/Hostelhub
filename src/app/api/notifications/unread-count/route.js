import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";

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

    await dbConnect();

    const query = {
      hostelId,
      isRead: false,
      $or: [
        { recipientId: userId.toString() },
        { recipientId: `all_${role}s` },
        { recipientId: role === 'admin' ? 'admin_group' : null }
      ].filter(Boolean)
    };

    const count = await Notification.countDocuments(query);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("GET /api/notifications/unread-count error:", error);
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
  }
}
