/**
 * GET /api/hostels/search
 * 
 * Search for hostels by name (returns only public-safe fields)
 * 
 * Query Params:
 * - query: string (minimum 2 characters)
 */

import { NextResponse } from "next/server";
import { searchHostelsByName } from "@/lib/firestore";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const hostels = await searchHostelsByName(query);

    return NextResponse.json(
      { success: true, hostels },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/hostels/search error:", error);
    return NextResponse.json(
      { error: "Failed to search hostels" },
      { status: 500 }
    );
  }
}
