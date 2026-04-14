/**
 * PATCH /api/hostels/[id]/settings
 * 
 * Update hostel settings (admin only)
 * 
 * Body:
 * - autoApprove: boolean (optional)
 * - hostelName: string (optional)
 * - address: string (optional)
 * - contactNumber: string (optional)
 * - capacity: number (optional)
 * - status: string (optional)
 */

import { NextResponse } from "next/server";
import { updateHostelSettings } from "@/lib/firestore";

export async function PATCH(request, { params }) {
  try {
    const { id: hostelId } = params;
    const data = await request.json();

    if (!hostelId) {
      return NextResponse.json(
        { error: "Hostel ID is required" },
        { status: 400 }
      );
    }

    await updateHostelSettings(hostelId, data);

    return NextResponse.json(
      {
        success: true,
        message: "Hostel settings updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/hostels/[id]/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id: hostelId } = params;

    if (!hostelId) {
      return NextResponse.json(
        { error: "Hostel ID is required" },
        { status: 400 }
      );
    }

    // Note: Import getHostelById from firestore
    const { getHostelById } = await import("@/lib/firestore");
    const hostel = await getHostelById(hostelId);

    if (!hostel) {
      return NextResponse.json(
        { error: "Hostel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, hostel },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/hostels/[id]/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
