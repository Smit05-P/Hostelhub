import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Admin from "@/models/Admin";
import { signToken, setAuthCookie } from "@/lib/auth";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    let { uid, email, name, photoURL, role, credential } = await req.json();

    if (credential) {
      const decoded = jwt.decode(credential);
      if (decoded) {
        email = decoded.email;
        name = decoded.name;
        photoURL = decoded.picture;
        uid = decoded.sub;
      }
    }

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
        // Cross-role check: Make sure they aren't already a student
        const studentCheck = await Student.findOne({ email });
        if (studentCheck) {
          return NextResponse.json({ 
            error: "You are registered as a Student. Please switch the role toggle to Student to log in." 
          }, { status: 403 });
        }

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
        // Cross-role check: Make sure they aren't already an admin
        const adminCheck = await Admin.findOne({ email });
        if (adminCheck) {
          return NextResponse.json({ 
            error: "You are registered as an Admin. Please switch the role toggle to Admin to log in." 
          }, { status: 403 });
        }

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
