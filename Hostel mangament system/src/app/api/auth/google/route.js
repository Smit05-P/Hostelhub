import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req) {
  try {
    const { uid, email, name, photoURL, role } = await req.json();

    if (!uid || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Double check if user exists (server-side check)
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return NextResponse.json({ message: "User already exists", role: userDocSnap.data().role });
    }

    // 2. Create refined User Profile
    const newUser = {
      uid,
      name,
      email,
      role,
      profilePicture: photoURL || null,
      authProvider: "google",
      created_at: serverTimestamp(),
      onboardingComplete: false,
    };

    if (role === "student") {
      newUser.hostelStatus = "NO_HOSTEL";
      newUser.hostelId = null;
    }

    // 3. Atomically create the user document
    await setDoc(userDocRef, newUser);

    return NextResponse.json({ 
      success: true, 
      message: "Profile created successfully", 
      role 
    });

  } catch (error) {
    console.error("API Auth Google Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
