/**
 * GET /api/hostels/[id]/members
 * DELETE /api/hostels/[id]/members
 * 
 * GET: Get all members of a hostel
 * DELETE: Remove a member from a hostel
 * 
 * Query Params (GET):
 * - status: approved | pending | all (optional, default: all)
 * 
 * Body (DELETE):
 * - membershipId: string (required)
 * - userId: string (required)
 */

import { NextResponse } from "next/server";
import { getHostelMembers, removeHostelMember } from "@/lib/firestore";

export async function GET(request, { params }) {
  try {
    const { id: hostelId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const members = await getHostelMembers({
      hostelId,
      status: status && status !== "all" ? status : null,
    });

    return NextResponse.json(
      { success: true, members },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/hostels/[id]/members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: hostelId } = params;
    const { membershipId, userId } = await request.json();

    if (!membershipId || !userId) {
      return NextResponse.json(
        { error: "Membership ID and User ID are required" },
        { status: 400 }
      );
    }

    await removeHostelMember({
      membershipId,
      userId,
      hostelId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Member removed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/hostels/[id]/members error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
