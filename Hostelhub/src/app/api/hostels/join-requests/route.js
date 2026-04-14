/**
 * POST /api/hostels/join-requests
 * GET /api/hostels/join-requests
 * 
 * POST: Create a new join request (for students searching hostels)
 * GET: Get join requests for a hostel (admin only)
 * 
 * POST Body:
 * - hostelId: string (required)
 * - userId: string (required)
 * - userName: string (from auth)
 * 
 * GET Query Params:
 * - hostelId: string (required for admin)
 * - status: pending | approved | rejected (optional)
 */

import { NextResponse } from "next/server";
import { createJoinRequest, getJoinRequests, getUserById } from "@/lib/firestore";

export async function POST(request) {
  try {
    const { hostelId, userId, userName } = await request.json();

    if (!hostelId || !userId) {
      return NextResponse.json(
        { error: "Hostel ID and User ID are required" },
        { status: 400 }
      );
    }

    // Get user info if userName not provided
    let displayName = userName;
    if (!displayName) {
      const user = await getUserById(userId);
      if (user) {
        displayName = user.name || user.email;
      }
    }

    const requestId = await createJoinRequest({
      userId,
      userName: displayName || "Student",
      hostelId,
    });

    return NextResponse.json(
      {
        success: true,
        requestId,
        message: "Join request submitted. Please wait for admin approval.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/hostels/join-requests error:", error);
    
    if (error.message.includes("already requested")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: error.message || "Failed to create join request" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hostelId = searchParams.get("hostelId");
    const status = searchParams.get("status");

    if (!hostelId) {
      return NextResponse.json(
        { error: "Hostel ID is required" },
        { status: 400 }
      );
    }

    const requests = await getJoinRequests({
      hostelId,
      status: status || "pending",
    });

    return NextResponse.json(
      { success: true, requests },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/hostels/join-requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch join requests" },
      { status: 500 }
    );
  }
}
