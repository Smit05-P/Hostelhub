import { getAllNotices, createNotice, createNotification } from "@/lib/firestore";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/notices - Fetch all notices
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cookieStore = await cookies();
    const hostelId =
      searchParams.get("hostelId") ||
      request.headers.get("x-hostel-id") ||
      cookieStore.get("hostel-id")?.value;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    const notices = await getAllNotices(hostelId);
    return NextResponse.json(notices);
  } catch (error) {
    console.error("GET Notices Error:", error);
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}

// POST /api/notices - Create a new notice
export async function POST(request) {
  try {
    const data = await request.json();
    const { title, description, date } = data;

    if (!title || !description || !date) {
      return NextResponse.json({ error: "Title, description, and date are required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const hostelId = 
      data.hostelId || 
      request.headers.get("x-hostel-id") || 
      cookieStore.get("hostel-id")?.value || 
      "primary-hostel";

    const id = await createNotice({ ...data, hostelId });
    
    // Broadcast notification to all students in the hostel
    await createNotification({
      hostelId,
      recipientId: "all_students",
      recipientRole: "student",
      senderId: "system",
      senderRole: "admin",
      senderName: "Administration",
      type: "announcement",
      title: "📢 New Announcement",
      message: title,
      actionUrl: "/student/notices"
    });

    return NextResponse.json({ message: "Notice created successfully", id });
  } catch (error) {
    console.error("POST Notice Error:", error);
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}
