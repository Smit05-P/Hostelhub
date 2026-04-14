/**
 * POST /api/hostels/join-requests/[id]/reject
 * 
 * Reject a join request (admin only)
 * 
 * Body:
 * - reason: string (optional)
 */

import { NextResponse } from "next/server";
import { rejectJoinRequest } from "@/lib/firestore";

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { reason } = await request.json();

    await rejectJoinRequest({
      requestId: id,
      reason: reason || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Join request rejected",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/hostels/join-requests/[id]/reject error:", error);
    
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message.includes("already been processed")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: error.message || "Failed to reject request" },
      { status: 500 }
    );
  }
}
