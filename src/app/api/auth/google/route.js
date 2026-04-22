import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Admin from "@/models/Admin";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const { uid, email, name, photoURL, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Missing required fields (email, role)" }, { status: 400 });
    }

    await dbConnect();

    let user = null;
    let userId = null;
    let hostelId = null;

    if (role === "admin") {
      user = await Admin.findOne({ email });
      if (user) {
        userId = user._id.toString();
        hostelId = user.hostelId?.toString();
      } else {
        // Create new admin (orphaned until hostel is created/linked)
        user = await Admin.create({
          name,
          email,
          profileImage: photoURL,
          authProvider: "google",
          status: "active"
        });
        userId = user._id.toString();
      }
    } else {
      user = await Student.findOne({ email });
      if (user) {
        userId = user._id.toString();
        hostelId = user.hostelId?.toString();
      } else {
        // Create new student
        user = await Student.create({
          name,
          email,
          profileImage: photoURL,
          authProvider: "google",
          status: "Active",
          hostelStatus: "NO_HOSTEL"
        });
        userId = user._id.toString();
      }
    }

    // Generate session token
    const token = signToken({ 
      userId, 
      email, 
      role,
      hostelId
    });

    // Set cookie
    await setAuthCookie(token);

    return NextResponse.json({ 
      success: true, 
      message: "Profile processed successfully", 
      role,
      userId,
      hostelId
    });

  } catch (error) {
    console.error("API Auth Google Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
