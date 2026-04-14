import { getNotifications, clearHostelNotifications } from "@/lib/firestore";
// Force rebuild to sync exports
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

    const notifications = await getNotifications({ hostelId, userId, role });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hostelId = searchParams.get("hostelId");
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }

    await clearHostelNotifications({ hostelId, userId, role });
    return NextResponse.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("DELETE /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to clear notifications" }, { status: 500 });
  }
}
