import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import JoinRequest from "@/models/JoinRequest";
import Hostel from "@/models/Hostel";
import Admin from "@/models/Admin";

export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hostelId, userId, userName } = await request.json();

    if (!hostelId || !userId) {
      return NextResponse.json(
        { error: "Hostel ID and User ID are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const hostel = await Hostel.findById(hostelId);

    const existing = await JoinRequest.findOne({
      userId,
      hostelId,
      status: "Pending",
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending request for this hostel." },
        { status: 409 }
      );
    }

    const newRequest = await JoinRequest.create({
      userId,
      userName: userName || "Student",
      userEmail: session.email || "",
      hostelId,
      hostelName: hostel?.name || "Hostel",
    });

    return NextResponse.json(
      {
        success: true,
        requestId: newRequest._id,
        message: "Join request submitted. Please wait for admin approval.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/hostels/join-requests error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create join request" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("studentId") || searchParams.get("userId");
    const status = searchParams.get("status");

    // Resolve hostelId: prefer query param > session > DB lookup for admin role
    let hostelId = searchParams.get("hostelId") || session.hostelId || null;
    if (!hostelId && session.role === "admin") {
      const admin = await Admin.findById(session.userId).select("hostelId");
      hostelId = admin?.hostelId?.toString() || null;
    }

    if (!hostelId && !userId) {
      return NextResponse.json(
        { error: "Hostel ID or User ID is required" },
        { status: 400 }
      );
    }

    const query = {};
    if (hostelId) query.hostelId = hostelId;
    if (userId) query.userId = userId;
    if (status && status !== "all") {
      // Use case-insensitive regex to handle legacy data if any remains
      query.status = { $regex: new RegExp(`^${status}$`, "i") };
    }

    const requests = await JoinRequest.find(query).sort({ updatedAt: -1, createdAt: -1 });
    
    // Transform _id to id for frontend compatibility
    const transformedRequests = requests.map(req => ({
      _id: req._id.toString(),
      id: req._id.toString(),
      userId: req.userId,
      userName: req.userName,
      userEmail: req.userEmail,
      hostelId: req.hostelId,
      hostelName: req.hostelName,
      method: req.method || 'search',
      status: req.status,
      duration: req.duration,
      joiningDate: req.joiningDate,
      requestedAt: req.createdAt,
      adminRemarks: req.adminRemarks,
      handledAt: req.handledAt
    }));

    return NextResponse.json({ success: true, requests: transformedRequests }, { status: 200 });
  } catch (error) {
    console.error("GET /api/hostels/join-requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch join requests" },
      { status: 500 }
    );
  }
}
