import { NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import Student from "@/models/Student";
import Room from "@/models/Room";
import Complaint from "@/models/Complaint";
import Visitor from "@/models/Visitor";
import Fee from "@/models/Fee";
import Notice from "@/models/Notice";
import Allocation from "@/models/Allocation";
import Payment from "@/models/Payment";

export async function GET(request) {
  try {
    const session = await protect(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedHostelId = searchParams.get("hostelId");
    const targetHostelId = (requestedHostelId && mongoose.Types.ObjectId.isValid(requestedHostelId))
      ? requestedHostelId
      : session.hostelId;

    if (!targetHostelId) {
      return NextResponse.json({ error: "Context (hostelId) is required." }, { status: 400 });
    }
    if (!targetHostelId || !mongoose.Types.ObjectId.isValid(targetHostelId)) {
      return NextResponse.json({ error: "Invalid hostelId format." }, { status: 400 });
    }

    await dbConnect();

    const report = {
      status: "Integrity check complete",
      hostelId: targetHostelId,
      results: {},
      total_orphans_found: 0,
      total_updates_executed: 0,
    };

    const modelsToAudit = {
      students: Student,
      rooms: Room,
      complaints: Complaint,
      visitors: Visitor,
      fees: Fee,
      notices: Notice,
      allocations: Allocation,
      payments: Payment,
    };

    for (const [name, Model] of Object.entries(modelsToAudit)) {
      // Find documents missing hostelId
      const orphanQuery = {
        $or: [
          { hostelId: { $exists: false } },
          { hostelId: null }
        ]
      };
      const orphans = await Model.find(orphanQuery);
      
      if (orphans.length > 0) {
        // Bulk update to selected hostel context
        const result = await Model.updateMany(
          orphanQuery,
          { $set: { hostelId: new mongoose.Types.ObjectId(targetHostelId) } }
        );
        
        report.results[name] = { 
          found: orphans.length, 
          updated: result.modifiedCount 
        };
        report.total_orphans_found += orphans.length;
        report.total_updates_executed += result.modifiedCount;
      } else {
        report.results[name] = { found: 0, updated: 0 };
      }
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Audit Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
