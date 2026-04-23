import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notice from "@/models/Notice";
import mongoose from "mongoose";

// GET /api/notices - Fetch all notices
export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hostelId = searchParams.get("hostelId") || session.hostelId;

    if (!hostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(hostelId)) {
      return NextResponse.json({ error: "Invalid Hostel ID format" }, { status: 400 });
    }

    await dbConnect();
    
    // Explicitly cast to ObjectId for robust querying
    const queryHostelId = new mongoose.Types.ObjectId(hostelId);
    
    const notices = await Notice.find({ hostelId: queryHostelId }).sort({ date: -1, createdAt: -1 });
    
    return NextResponse.json(notices, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("GET Notices Error:", error);
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}

// POST /api/notices - Create a new notice
export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { title, description, date, priority, category } = data;

    if (!title || !description || !date) {
      return NextResponse.json({ error: "Title, description, and date are required" }, { status: 400 });
    }

    // Prioritize hostelId from request (data or query) if present, then session
    let hostelId = data.hostelId || session.hostelId;
    
    if (!hostelId) {
      return NextResponse.json({ error: "Hostel context missing" }, { status: 400 });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(hostelId)) {
      return NextResponse.json({ error: "Invalid Hostel ID format" }, { status: 400 });
    }

    await dbConnect();
    const finalHostelId = new mongoose.Types.ObjectId(hostelId);
    
    console.log("[NOTICE_CREATE] Attempting create:", { title, hostelId: finalHostelId, priority });
    
    const notice = await Notice.create({
      title,
      description,
      date: new Date(date),
      hostelId: finalHostelId,
      priority: (priority || 'medium').toLowerCase(),
      category: category || 'General'
    });
    
    console.log("[NOTICE_CREATE] Success:", notice._id);

    // Notify all students
    try {
      const { notificationService } = require("@/services/server/notificationService");
      await notificationService.createNotification({
        hostelId: finalHostelId.toString(),
        recipientId: "all_students",
        recipientRole: "student",
        senderId: session.userId,
        senderRole: "admin",
        senderName: "Admin",
        type: "notice_created",
        title: "New Notice Posted",
        message: `${title} - ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
        actionUrl: "/student/notices"
      });
      console.log("[NOTICE_CREATE] Notification sent to all students");
    } catch (notifErr) {
      console.error("[NOTICE_CREATE] Failed to send notification:", notifErr);
      // Non-fatal, continue returning success for notice creation
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Notice created successfully", 
      id: notice._id,
      notice 
    });
  } catch (error) {
    console.error("POST Notice Error:", error);
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}
