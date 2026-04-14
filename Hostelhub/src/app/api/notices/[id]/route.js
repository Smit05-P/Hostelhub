import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { NextResponse } from "next/server";

// PUT /api/notices/[id] - Update a notice
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { title, description, date, priority } = await request.json();

    if (!id || !title || !description || !date) {
      return NextResponse.json({ error: "ID, title, description, and date are required" }, { status: 400 });
    }

    const docRef = doc(db, "notices", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    await updateDoc(docRef, {
      title,
      description,
      date,
      priority: priority || 'normal',
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ message: "Notice updated successfully" });
  } catch (error) {
    console.error("PUT Notice Error:", error);
    return NextResponse.json({ error: "Failed to update notice" }, { status: 500 });
  }
}

// DELETE /api/notices/[id] - Delete a notice
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
       return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const docRef = doc(db, "notices", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    await deleteDoc(docRef);

    return NextResponse.json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("DELETE Notice Error:", error);
    return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 });
  }
}
