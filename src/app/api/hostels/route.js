import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { hostelService } from "@/services/server/hostelService";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");
    
    // Verify the requesting user matches the adminId
    if (!adminId || (session.userId !== adminId)) {
      return NextResponse.json({ error: "Unauthorized. You can only access your own hostels." }, { status: 403 });
    }
    
    const hostels = await hostelService.getHostelByOwner(adminId);
    
    // Transform to match current expectations if necessary
    // Current frontend expects some stats (rooms, students counts)
    // We can add them later or do a populate/aggregation in hostelService
    
    return NextResponse.json(hostels, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/hostels error:", error);
    return NextResponse.json({ error: "Failed to fetch hostels." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await protect(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    if (!data.hostelName || !data.address) {
      return NextResponse.json({ error: "Hostel Name and Address are required." }, { status: 400 });
    }

    const hostel = await hostelService.createHostel({
      name: data.hostelName,
      address: data.address,
      ownerId: session.userId,
      phone: data.contactNumber,
      capacity: parseInt(data.capacity) || 0,
      settings: data.settings || {}
    });

    console.log("Hostel created successfully:", hostel.id);

    // Link the hostel to the admin
    if (session.userId) {
      try {
        await dbConnect(); // Ensure DB is connected for Admin model
        const updatedAdmin = await Admin.findByIdAndUpdate(session.userId, {
          hostelId: hostel.id
        }, { new: true });
        
        if (!updatedAdmin) {
          console.warn(`Admin with ID ${session.userId} not found during link operation.`);
        } else {
          console.log("Admin linked to hostel successfully.");
        }
      } catch (linkError) {
        console.error("Failed to link admin to hostel:", linkError);
        // We don't fail the whole request if linking failed, 
        // but it's good to know. Actually, maybe we should fail?
        // For now, let's just log it.
      }
    }

    return NextResponse.json({ success: true, id: hostel.id });
  } catch (error) {
    console.error("POST /api/hostels detailed error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code // MongoDB error codes
    });
    
    // Check for duplicate key error (common with joinCode if indexes are messed up)
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "A conflict occurred. Please try again.",
        details: "A unique constraint was violated (likely joinCode)." 
      }, { status: 409 });
    }

    return NextResponse.json({ 
      error: "Failed to create hostel.",
      message: error.message 
    }, { status: 500 });
  }
}
