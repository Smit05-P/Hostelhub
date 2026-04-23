import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notice from "@/models/Notice";
import Visitor from "@/models/Visitor";
import { notificationService } from "@/services/server/notificationService";

// POST /api/visitors/broadcast - Inform all residents about active/pending guest entries
export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const hostelId = body?.hostelId || session.hostelId;
    const guestCountHint = Number(body?.guestCountHint || 0);
    const audience = body?.audience || "all_users";
    const visitorName = (body?.visitorName || "").toString().trim();
    const visitorType = (body?.visitorType || "Guest").toString().trim();
    const purpose = (body?.purpose || "").toString().trim();
    const location = (body?.location || "").toString().trim();
    const notes = (body?.notes || "").toString().trim();
    const priority = (body?.priority || "high").toString().toLowerCase();

    if (!hostelId) {
      return NextResponse.json({ error: "Hostel context missing" }, { status: 400 });
    }

    if (!visitorName || !purpose) {
      return NextResponse.json({ error: "Visitor name and purpose are required." }, { status: 400 });
    }

    await dbConnect();
    const hostelIdFilters = [hostelId];
    let hostelObjectId = null;
    if (mongoose.Types.ObjectId.isValid(hostelId)) {
      hostelObjectId = new mongoose.Types.ObjectId(hostelId);
      hostelIdFilters.push(hostelObjectId);
    }

    const dbGuestCount = await Visitor.countDocuments({
      hostelId: { $in: hostelIdFilters },
      status: { $regex: /^(pending|approved|completed)$/i },
    });

    const guestCount = Math.max(dbGuestCount, Number.isFinite(guestCountHint) ? guestCountHint : 0);

    if (!hostelObjectId) {
      return NextResponse.json(
        { error: "Invalid hostel context for broadcast. Please re-select your hostel and retry." },
        { status: 400 }
      );
    }

    const timestamp = new Date();
    const title = `VISITOR ALERT: ${visitorName.toUpperCase()} ARRIVED`;
    const messageParts = [
      `${visitorType} ${visitorName} has arrived.`,
      `Purpose: ${purpose}.`,
      location ? `Location: ${location}.` : "",
      guestCount > 0 ? `Active guest records: ${guestCount}.` : "",
      notes ? `Notes: ${notes}.` : "",
      "Please follow hostel security protocols.",
    ].filter(Boolean);
    const message = messageParts.join(" ");

    const now = new Date();
    const visitTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Create a hostel-wide visitor log entry so it appears in both admin and student visitor modules.
    // ONLY create a new record if we don't already have one for this specific broadcast today.
    // If it's a general broadcast (SECURITY PROTOCOL), we create a marker.
    // If it's for a specific visitor, we should ideally not create a duplicate.
    
    let visitorEntry = null;
    const isGeneralBroadcast = visitorName === "SECURITY PROTOCOL";
    
    if (isGeneralBroadcast) {
      visitorEntry = await Visitor.create({
        hostelId: hostelObjectId,
        studentId: null,
        studentName: "HOSTEL-WIDE",
        roomNo: location || "MANAGEMENT",
        visitorName,
        visitorPhone: "",
        relation: visitorType,
        visitDate: now,
        visitTime,
        expectedDuration: 60,
        purpose,
        notes: notes || "Broadcast created by admin.",
        status: "Completed",
        checkInTime: now,
        adminNote: "Broadcast entry",
      });
    }

    // REMOVED: Notice.create - Visitor requests should only show in Visitor module, not Notice module.


    const recipientGroups = [];
    if (audience === "all_students") {
      recipientGroups.push({ recipientId: "all_students", recipientRole: "student", actionUrl: "/student/visitors" });
    } else if (audience === "all_admins") {
      recipientGroups.push({ recipientId: "all_admins", recipientRole: "admin", actionUrl: "/admin/notifications" });
    } else {
      recipientGroups.push(
        { recipientId: "all_students", recipientRole: "student", actionUrl: "/student/visitors" },
        { recipientId: "all_admins", recipientRole: "admin", actionUrl: "/admin/visitors" }
      );
    }

    await Promise.all(
      recipientGroups.map((recipient) =>
        notificationService.createNotification({
          hostelId: hostelObjectId,
          recipientId: recipient.recipientId,
          recipientRole: recipient.recipientRole,
          senderId: session.userId || "system",
          senderRole: session.role || "admin",
          senderName: session.name || session.username || "Hostel Administration",
          type: "announcement",
          title: "Guest Arrival Advisory",
          message,
          actionUrl: recipient.actionUrl,
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Hostel informed successfully",
      guestCount,
      visitorEntryId: visitorEntry?._id,
      timestamp,
    });
  } catch (error) {
    console.error("POST /api/visitors/broadcast error:", error);
    return NextResponse.json({ error: "Failed to broadcast guest advisory" }, { status: 500 });
  }
}
