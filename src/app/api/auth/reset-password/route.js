import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import Student from "@/models/Student";
import crypto from "crypto";

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Hash token to match DB
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Check Student first
    let user = await Student.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    // Check Admin if not found
    if (!user) {
      user = await Admin.findOne({
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { $gt: Date.now() }
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Set new password (the models' pre-save hooks will handle bcrypt hashing)
    if (user.passwordHash !== undefined) {
      user.passwordHash = password; 
    } else {
      user.password = password; 
    }

    // Clear reset tokens
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return NextResponse.json({ message: "Password has been successfully reset" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
