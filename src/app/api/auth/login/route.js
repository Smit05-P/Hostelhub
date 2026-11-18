import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Student from '@/models/Student';
import JoinRequest from '@/models/JoinRequest';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { email, password, role } = body || {};

    // 1. Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Please provide email, password, and role' }, 
        { status: 400 }
      );
    }

    // 2. Validate role
    if (role !== 'admin' && role !== 'student') {
      return NextResponse.json(
        { error: 'Role must be either "admin" or "student"' }, 
        { status: 400 }
      );
    }

    // 3. Connect to database with error handling
    try {
      await dbConnect();
    } catch (dbErr) {
      console.error('[Login DB Error]:', dbErr.message);
      return NextResponse.json(
        { error: 'Database connection failed. Please ensure MongoDB is reachable.' }, 
        { status: 503 }
      );
    }

    // 4. Normalize email
    const normalizedEmail = String(email).trim().toLowerCase();

    let user = null;
    let isMatch = false;

    if (role === 'admin') {
      user = await Admin.findOne({ email: normalizedEmail }).select('+password').populate('hostelId');
      if (user) {
        // Check if user account was created via Google without a password
        if (!user.password && user.authProvider === 'google') {
          return NextResponse.json({ 
            error: 'This account was created using Google. Please sign in with Google.' 
          }, { status: 401 });
        }
        isMatch = await user.matchPassword(password);
      } else {
        // Cross-role check
        const studentCheck = await Student.findOne({ email: normalizedEmail });
        if (studentCheck) {
          return NextResponse.json({ 
            error: 'You are registered as a Student. Please switch the role toggle to Student to log in.' 
          }, { status: 403 });
        }
      }
    } else {
      user = await Student.findOne({ email: normalizedEmail }).select('+passwordHash').populate('hostelId');
      if (user) {
        // Check if user account was created via Google without a password
        if (!user.passwordHash && user.authProvider === 'google') {
          return NextResponse.json({ 
            error: 'This account was created using Google. Please sign in with Google.' 
          }, { status: 401 });
        }
        isMatch = await user.matchPassword(password);
      } else {
        // Cross-role check
        const adminCheck = await Admin.findOne({ email: normalizedEmail });
        if (adminCheck) {
          return NextResponse.json({ 
            error: 'You are registered as an Admin. Please switch the role toggle to Admin to log in.' 
          }, { status: 403 });
        }
      }
    }

    if (!user || !isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check account status if applicable
    if (user.status === 'inactive' || user.status === 'Inactive') {
      return NextResponse.json({ 
        error: 'Your account is inactive. Please contact your hostel administrator.' 
      }, { status: 403 });
    }

    // PRE-JWT REPAIR (students only)
    // If the student's status in the DB isn't Approved yet but their JoinRequest is,
    // sync it immediately before issuing the token.
    if (role === 'student' && user.hostelStatus !== 'Approved') {
      try {
        const latestReq = await JoinRequest.findOne({ userId: user._id.toString() })
          .sort({ createdAt: -1 });

        if (latestReq && latestReq.status === 'Approved' && latestReq.hostelId) {
          console.log(`[LOGIN-REPAIR] Updating student ${user.email}: PENDING -> Approved`);
          await Student.findByIdAndUpdate(user._id, {
            hostelStatus: 'Approved',
            hostelId: latestReq.hostelId,
            status: 'Active'
          });
          user.hostelId = latestReq.hostelId;
          user.hostelStatus = 'Approved';
        }
      } catch (repairErr) {
        console.warn('[LOGIN-REPAIR] Non-fatal sync warning:', repairErr.message);
      }
    }

    // Resolve hostelId
    const resolvedHostelId = user.hostelId?._id?.toString() || user.hostelId?.toString() || null;

    // Generate session token (JWT)
    const token = signToken({ 
      userId: user._id.toString(), 
      email: user.email, 
      role: role,
      hostelId: resolvedHostelId
    });

    // Set secure HTTP-only cookie
    await setAuthCookie(token);

    // Return safe user payload (no passwords or hashes)
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: role,
        hostelId: resolvedHostelId,
      }
    });

  } catch (error) {
    console.error('Login error [POST /api/auth/login]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
