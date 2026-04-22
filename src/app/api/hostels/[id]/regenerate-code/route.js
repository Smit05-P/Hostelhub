import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { hostelService } from "@/services/server/hostelService";

/**
 * POST /api/hostels/[id]/regenerate-code
 * Generate a new unique join code for the hostel (admin only)
 */
export async function POST(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: hostelId } = await params;

    if (!hostelId) {
      return NextResponse.json({ error: "Hostel ID is required" }, { status: 400 });
    }

    const updatedHostel = await hostelService.regenerateJoinCode(hostelId);

    return NextResponse.json({
      success: true,
      joinCode: updatedHostel.joinCode,
      message: "New join code generated successfully",
    }, { status: 200 });
  } catch (error) {
    console.error("POST /api/hostels/[id]/regenerate-code error:", error);
    return NextResponse.json({ error: "Failed to regenerate code" }, { status: 500 });
  }
}
