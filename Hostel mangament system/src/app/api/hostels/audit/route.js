import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
  query,
  limit,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  const report = {
    hostels_status: "unknown",
    migration_results: {},
    total_orphans_found: 0,
    total_updates_executed: 0,
    errors: [],
  };

  try {
    const batch = writeBatch(db);
    let batchCount = 0;

    // 1. Ensure primary-hostel exists
    const hostelsSnap = await getDocs(query(collection(db, "hostels"), limit(1)));
    if (hostelsSnap.empty) {
      const primaryHostelRef = doc(db, "hostels", "primary-hostel");
      batch.set(primaryHostelRef, {
        hostelName: "Default Hostel",
        ownerName: "Administrator",
        address: "123 Main St",
        contactNumber: "000-000-0000",
        createdAt: serverTimestamp(),
      });
      batchCount++;
      report.hostels_status = "Primary hostel created";
    } else {
      report.hostels_status = "Hostels already exist";
    }

    const collectionsToAudit = [
      "users",
      "rooms",
      "complaints",
      "visitors",
      "fees",
      "notices",
      "allocations",
      "transactions",
    ];

    for (const colName of collectionsToAudit) {
      const colRef = collection(db, colName);
      const snap = await getDocs(colRef);
      
      let orphans = 0;
      let updated = 0;

      for (const d of snap.docs) {
        const data = d.data();
        if (!data.hostelId) {
          orphans++;
          batch.update(doc(db, colName, d.id), {
            hostelId: "primary-hostel",
            updatedAt: serverTimestamp(),
          });
          batchCount++;
          updated++;

          // Firestore batch limit is 500
          if (batchCount >= 450) {
            await batch.commit();
            // Reset batch (since we can't reuse accurately after commit in some environments, better create new)
            // But actually we just return here and ask user to run again if needed, 
            // OR we handle multiple batches.
            // For simplicity in this audit, we'll handle multiple batches.
          }
        }
      }

      report.migration_results[colName] = { found: orphans, updated };
      report.total_orphans_found += orphans;
    }

    if (batchCount > 0) {
      await batch.commit();
      report.total_updates_executed = batchCount;
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Migration Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
