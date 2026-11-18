import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Admin from "@/models/Admin";
import Hostel from "@/models/Hostel";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const errorParam = searchParams.get("error");

    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${proto}://${host}`;

    if (errorParam) {
      console.error("[Google Callback] OAuth error from Google:", errorParam);
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(errorParam)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/login?error=missing_code`);
    }

    let role = "student";
    if (stateParam) {
      try {
        const decoded = JSON.parse(Buffer.from(stateParam, "base64").toString("utf-8"));
        if (decoded.role) role = decoded.role;
      } catch (e) {
        console.warn("[Google Callback] Could not parse state parameter:", e.message);
      }
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${baseUrl}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret || "",
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("[Google Callback] Token exchange failed:", errBody);
      return NextResponse.redirect(`${baseUrl}/login?error=token_exchange_failed`);
    }

    const tokens = await tokenRes.json();
    let verifiedUser;

    if (tokens.id_token) {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      verifiedUser = {
        googleId: payload.sub,
        email: payload.email.trim().toLowerCase(),
        name: payload.name || payload.email.split("@")[0],
        picture: payload.picture || null,
      };
    } else if (tokens.access_token) {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userInfoRes.json();
      verifiedUser = {
        googleId: userInfo.sub,
        email: (userInfo.email || "").trim().toLowerCase(),
        name: userInfo.name || userInfo.email?.split("@")[0] || "User",
        picture: userInfo.picture || null,
      };
    } else {
      return NextResponse.redirect(`${baseUrl}/login?error=no_tokens_received`);
    }

    await dbConnect();

    const { googleId, email, name, picture } = verifiedUser;
    let user = null;
    let hostelId = null;

    if (role === "admin") {
      const studentCheck = await Student.findOne({ email });
      if (studentCheck) {
        return NextResponse.redirect(`${baseUrl}/login?error=role_conflict_student`);
      }

      user = await Admin.findOne({ email });
      if (user) {
        if (!user.googleId) user.googleId = googleId;
        if (!user.profileImage && picture) user.profileImage = picture;
        user.lastLogin = new Date();
        await user.save();
        hostelId = user.hostelId?.toString() || null;
      } else {
        const newHostel = await Hostel.create({
          name: `${name}'s Hostel`,
          address: "Not specified",
          phone: "",
          ownerId: "placeholder",
        });

        user = await Admin.create({
          name,
          email,
          googleId,
          profileImage: picture,
          authProvider: "google",
          role: "admin",
          status: "active",
          hostelId: newHostel._id,
          lastLogin: new Date(),
        });

        newHostel.ownerId = user._id.toString();
        await newHostel.save();
        hostelId = newHostel._id.toString();
      }
    } else {
      const adminCheck = await Admin.findOne({ email });
      if (adminCheck) {
        return NextResponse.redirect(`${baseUrl}/login?error=role_conflict_admin`);
      }

      user = await Student.findOne({ email });
      if (user) {
        if (!user.googleId) user.googleId = googleId;
        if (!user.profileImage && picture) user.profileImage = picture;
        await user.save();
        hostelId = user.hostelId?.toString() || null;
      } else {
        user = await Student.create({
          name,
          email,
          googleId,
          profileImage: picture,
          authProvider: "google",
          role: "student",
          status: "Active",
          hostelStatus: "No-Hostel",
        });
        hostelId = null;
      }
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role,
      hostelId,
    });

    await setAuthCookie(token);

    const redirectPath = role === "admin" ? "/admin/hostels" : (hostelId ? "/student/dashboard" : "/student/select-hostel");
    return NextResponse.redirect(`${baseUrl}${redirectPath}`);
  } catch (error) {
    console.error("[Google Callback Error]:", error);
    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    return NextResponse.redirect(`${proto}://${host}/login?error=authentication_failed`);
  }
}
