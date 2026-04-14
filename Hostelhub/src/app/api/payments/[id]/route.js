import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "transactions", id));
    return NextResponse.json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    console.error("DELETE Payment Error:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
