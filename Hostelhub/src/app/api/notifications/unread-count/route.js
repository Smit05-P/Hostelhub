import { getUnreadNotificationCount } from "@/lib/firestore";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hostelId = searchParams.get("hostelId");
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }

    const count = await getUnreadNotificationCount({ hostelId, userId, role });
    return NextResponse.json({ count });
  } catch (error) {
    console.error("GET /api/notifications/unread-count error:", error);
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
  }
}
