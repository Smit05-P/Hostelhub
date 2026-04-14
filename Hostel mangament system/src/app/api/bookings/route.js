import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  where
} from "firebase/firestore";
import { NextResponse } from "next/server";

// GET /api/bookings - Fetch all bookings
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    
    const bookingsCol = collection(db, "bookings");
    let q = query(bookingsCol, orderBy("createdAt", "desc"));

    if (studentId) {
      q = query(q, where("studentId", "==", studentId));
    }

    const querySnapshot = await getDocs(q);
    const bookings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || null
    }));

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("GET Bookings Error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request) {
  try {
    const data = await request.json();
    const { studentId, roomId, studentName, roomNumber, startDate, endDate, status } = data;

    if (!studentId || !roomId) {
      return NextResponse.json({ error: "Student and Room IDs are required" }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, "bookings"), {
      studentId,
      roomId,
      studentName: studentName || "",
      roomNumber: roomNumber || "",
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || 'Pending',
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ message: "Booking created successfully", id: docRef.id });
  } catch (error) {
    console.error("POST Booking Error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
