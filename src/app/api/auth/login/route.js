import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Student from '@/models/Student';
import JoinRequest from '@/models/JoinRequest';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('Login error: JWT_SECRET is not defined');
      return NextResponse.json({ error: 'Server misconfiguration: JWT_SECRET is missing' }, { status: 500 });
    }

    await dbConnect();
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Please provide email, password and role' }, { status: 400 });
    }

    let user = null;
    let isMatch = false;

    if (role === 'admin') {
      user = await Admin.findOne({ email }).select('+password').populate('hostelId');
      if (user) {
        isMatch = await user.matchPassword(password);
      }
    } else {
      user = await Student.findOne({ email }).select('+passwordHash').populate('hostelId');
      if (user) {
        isMatch = await user.matchPassword(password);
      }
    }

    if (!user || !isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // PRE-JWT REPAIR (students only)
    // If the student's status in the DB isn't APPROVED yet but their JoinRequest is,
    // fix it RIGHT NOW before issuing the token. This guarantees the first session
    // call after login returns the correct status with no delay.
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
          // Patch the in-memory object so the JWT gets the correct hostelId
          user.hostelId = latestReq.hostelId;
          user.hostelStatus = 'Approved';
        }
      } catch (repairErr) {
        console.warn('[LOGIN-REPAIR] Failed (non-fatal):', repairErr.message);
      }
    }

    // Generate session token (JWT)
    const token = signToken({ 
      userId: user._id.toString(), 
      email: user.email, 
      role: role,
      hostelId: user.hostelId?._id?.toString() || user.hostelId?.toString() 
    });

    // Set cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        hostelId: user.hostelId?._id || user.hostelId,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
