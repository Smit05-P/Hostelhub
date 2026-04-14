/**
 * POST /api/hostels/[id]/regenerate-code
 * 
 * Generate a new unique join code for the hostel
 */

import { NextResponse } from "next/server";
import { regenerateJoinCode } from "@/lib/firestore";

export async function POST(request, { params }) {
  try {
    const { id: hostelId } = params;

    if (!hostelId) {
      return NextResponse.json(
        { error: "Hostel ID is required" },
        { status: 400 }
      );
    }

    const joinCode = await regenerateJoinCode(hostelId);

    return NextResponse.json(
      {
        success: true,
        joinCode,
        message: "New join code generated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/hostels/[id]/regenerate-code error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate code" },
      { status: 500 }
    );
  }
}
