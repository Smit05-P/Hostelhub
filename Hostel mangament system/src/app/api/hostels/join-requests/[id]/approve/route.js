/**
 * POST /api/hostels/join-requests/[id]/approve
 * 
 * Approve a join request (admin only)
 * 
 * Body:
 * - hostelId: string (required)
 * - userId: string (required)
 */

import { NextResponse } from "next/server";
import { approveJoinRequest } from "@/lib/firestore";

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { hostelId, userId } = await request.json();

    if (!hostelId || !userId) {
      return NextResponse.json(
        { error: "Hostel ID and User ID are required" },
        { status: 400 }
      );
    }

    const result = await approveJoinRequest({
      requestId: id,
      userId,
      hostelId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Join request approved",
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/hostels/join-requests/[id]/approve error:", error);
    
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message.includes("already been processed")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: error.message || "Operation failed" },
      { status: 500 }
    );
  }
}
