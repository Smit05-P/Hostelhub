import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { hostelService } from "@/services/server/hostelService";

/**
 * PATCH /api/hostels/[id]/settings
 * Update hostel settings (admin only)
 */
export async function PATCH(request, { params }) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: hostelId } = await params;
    const body = await request.json();

    if (!hostelId) {
      return NextResponse.json({ error: "Hostel ID is required" }, { status: 400 });
    }

    // Map body settings to model structure if needed
    // In Hostel.js model, settings is an object
    await hostelService.updateHostelSettings(hostelId, body);

    return NextResponse.json({
      success: true,
      message: "Hostel settings updated successfully",
    }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/hostels/[id]/settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

/**
 * GET /api/hostels/[id]/settings
 * Fetch hostel settings
 */
export async function GET(request, { params }) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: hostelId } = await params;

    if (!hostelId) {
      return NextResponse.json({ error: "Hostel ID is required" }, { status: 400 });
    }

    const hostel = await hostelService.getHostelById(hostelId);

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, hostel }, { status: 200 });
  } catch (error) {
    console.error("GET /api/hostels/[id]/settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
