import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import Student from "@/models/Student";
import crypto from "crypto";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    let user = await Student.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await Admin.findOne({ email: email.toLowerCase() });
    }

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account exists with this email, a password reset link has been sent."
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save token to user (expires in 1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In production, you would send an email here with:
    // const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    // await sendEmail({ to: email, subject: "Password Reset", html: `...` });

    console.log(`[Password Reset] Token generated for ${email}: ${resetToken}`);

    return NextResponse.json({
      message: "If an account exists with this email, a password reset link has been sent."
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
