import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Admin from "@/models/Admin";
import Hostel from "@/models/Hostel";
import { signToken, setAuthCookie } from "@/lib/auth";

function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
}

/**
 * Independently verify Google token (ID Token or Access Token) on the backend
 */
async function verifyGoogleToken({ credential, accessToken }) {
  const clientId = getGoogleClientId();

  // 1. If an ID Token (credential) is provided, verify cryptographically
  if (credential && typeof credential === "string") {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("Unable to retrieve email from Google ID token payload");
    }
    return {
      googleId: payload.sub,
      email: payload.email.trim().toLowerCase(),
      emailVerified: !!payload.email_verified,
      name: payload.name || payload.email.split("@")[0],
      picture: payload.picture || null,
    };
  }

  // 2. If an Access Token is provided, verify via Google's tokeninfo endpoint
  if (accessToken && typeof accessToken === "string") {
    const tokenInfoRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    );
    if (!tokenInfoRes.ok) {
      throw new Error("Failed to verify access token with Google tokeninfo");
    }
    const tokenInfo = await tokenInfoRes.json();

    // Verify audience / azp matches our configured client ID if client ID is set
    if (clientId && tokenInfo.aud !== clientId && tokenInfo.azp !== clientId) {
      console.warn("[Google Auth] Warning: tokeninfo audience mismatch:", {
        tokenAud: tokenInfo.aud,
        tokenAzp: tokenInfo.azp,
        expectedClientId: clientId,
      });
    }

    // Fetch userinfo from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userInfoRes.ok) {
      throw new Error("Failed to retrieve profile from Google userinfo");
    }
    const userInfo = await userInfoRes.json();

    return {
      googleId: userInfo.sub,
      email: (userInfo.email || "").trim().toLowerCase(),
      emailVerified: userInfo.email_verified !== false,
      name: userInfo.name || userInfo.email?.split("@")[0] || "User",
      picture: userInfo.picture || null,
    };
  }

  throw new Error("No Google credential or access token provided");
}

/**
 * POST /api/auth/google
 * Processes Google sign-in/signup with independent server-side verification
 */
export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { credential, accessToken, role } = body || {};

    if (!role || (role !== "admin" && role !== "student")) {
      return NextResponse.json(
        { error: 'Valid role ("admin" or "student") is required' },
        { status: 400 }
      );
    }

    if (!credential && !accessToken) {
      return NextResponse.json(
        { error: "Google authentication token (credential or accessToken) is required" },
        { status: 400 }
      );
    }

    // 1. Independently verify the token with Google
    let verifiedUser;
    try {
      verifiedUser = await verifyGoogleToken({ credential, accessToken });
    } catch (verifyError) {
      console.error("[Google Auth Verification Error]:", verifyError.message);
      return NextResponse.json(
        { error: `Google verification failed: ${verifyError.message}` },
        { status: 401 }
      );
    }

    const { googleId, email, emailVerified, name, picture } = verifiedUser;

    if (!emailVerified) {
      return NextResponse.json(
        { error: "Your Google account email address is not verified by Google" },
        { status: 400 }
      );
    }

    // 2. Database connection
    try {
      await dbConnect();
    } catch (dbErr) {
      console.error("[Google Auth DB Error]:", dbErr.message);
      return NextResponse.json(
        { error: "Database connection failed. Please ensure MongoDB is reachable." },
        { status: 503 }
      );
    }

    let user = null;
    let hostelId = null;

    if (role === "admin") {
      // Cross-role check
      const studentCheck = await Student.findOne({ email });
      if (studentCheck) {
        return NextResponse.json({ 
          error: "You are registered as a Student. Please switch the role toggle to Student to log in." 
        }, { status: 403 });
      }

      user = await Admin.findOne({ email });

      if (user) {
        // Link existing account with Google if not already linked
        let modified = false;
        if (!user.googleId) {
          user.googleId = googleId;
          modified = true;
        }
        if (!user.profileImage && picture) {
          user.profileImage = picture;
          modified = true;
        }
        user.lastLogin = new Date();
        if (modified) await user.save();

        hostelId = user.hostelId?.toString() || null;
      } else {
        // Create new Admin and default Hostel
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
      // role === 'student'
      // Cross-role check
      const adminCheck = await Admin.findOne({ email });
      if (adminCheck) {
        return NextResponse.json({ 
          error: "You are registered as an Admin. Please switch the role toggle to Admin to log in." 
        }, { status: 403 });
      }

      user = await Student.findOne({ email });

      if (user) {
        // Link existing student account
        let modified = false;
        if (!user.googleId) {
          user.googleId = googleId;
          modified = true;
        }
        if (!user.profileImage && picture) {
          user.profileImage = picture;
          modified = true;
        }
        if (modified) await user.save();

        hostelId = user.hostelId?.toString() || null;
      } else {
        // Create new Student
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

    // 3. Issue unified JWT session token
    const token = signToken({ 
      userId: user._id.toString(), 
      email: user.email, 
      role,
      hostelId
    });

    // 4. Set secure HTTP-only cookie
    await setAuthCookie(token);

    return NextResponse.json({ 
      success: true, 
      message: "Authenticated successfully with Google", 
      role,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role,
        hostelId,
        profileImage: user.profileImage || null,
      }
    });

  } catch (error) {
    console.error("API Auth Google Error [POST /api/auth/google]:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/google
 * Generates Google OAuth 2.0 authorization URL for redirect-based flow
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "student";
    const clientId = getGoogleClientId();

    if (!clientId) {
      return NextResponse.json(
        { error: "GOOGLE_CLIENT_ID is not configured" },
        { status: 500 }
      );
    }

    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${proto}://${host}/api/auth/google/callback`;

    const state = Buffer.from(JSON.stringify({ role })).toString("base64");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state,
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.redirect(googleAuthUrl);
  } catch (error) {
    console.error("Error generating Google OAuth URL:", error);
    return NextResponse.json({ error: "Failed to initiate Google OAuth" }, { status: 500 });
  }
}
