import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { getSession, clearAuthCookie } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Student from '@/models/Student';
import Hostel from '@/models/Hostel';
import JoinRequest from '@/models/JoinRequest';

const isValidObjectId = (value) => (
  typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)
);

/**
 * GET: Retrieves the current merged session from JWT cookie
 * This is the high-fidelity source of truth for the local AuthContext hydration.
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      console.log('[SESSION] No session found in cookie');
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    if (!isValidObjectId(session.userId)) {
      console.warn('[SESSION] Invalid session userId detected:', session.userId);
      await clearAuthCookie();
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    await dbConnect();

    let userData = null;
    let activeHostelData = null;

    if (session.role === 'admin') {
      userData = await Admin.findById(session.userId)
        .select('name email role hostelId profileImage status')
        .lean();

      if (!userData) {
        userData = await Hostel.findById(session.userId)
          .select('name email status')
          .lean();
      }
    } else {
      let student = await Student.findById(session.userId)
        .select('name email role hostelId profileImage status hostelStatus phone address joiningDate idProof arrivalDate duration termEndDate daysLeft rentAmount balance emergencyContact guardianName collegeName course year roomId enrollmentId');
      
      if (student) {
        // --- SELF-HEALING LOGIC ---
        // Cross-reference the student record with the latest JoinRequest.
        // Fixes cases where the student record was not updated during admin approval.
        const latestRequest = await JoinRequest.findOne({
          $or: [
            { userId: session.userId },
            { userId: new mongoose.Types.ObjectId(session.userId) },
            { userEmail: student.email }
          ]
        }).sort({ createdAt: -1 });

        if (latestRequest && student.hostelStatus !== 'Approved') {
          const requestStatus = latestRequest.status;
          const studentStatus = student.hostelStatus;

          if (requestStatus !== studentStatus) {
            console.log(`[SESSION-REPAIR] Syncing status for ${student.email}: ${studentStatus} -> ${requestStatus}`);
            student.hostelStatus = requestStatus;

            if (requestStatus === 'Approved' && latestRequest.hostelId) {
              student.hostelId = latestRequest.hostelId;
              student.status = 'Active';
              console.log(`[SESSION-REPAIR] hostelId set to: ${latestRequest.hostelId}`);
            } else if (requestStatus === 'Rejected') {
              student.hostelId = null;
              student.status = 'Inactive';
            }
            await student.save();
          }
        }
        
        userData = student.toObject();
      }
    }

    if (!userData) {
      console.warn('[SESSION] User not found with ID:', session.userId);
      await clearAuthCookie();
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    console.log('[SESSION] User data retrieved:', { 
      role: session.role, 
      hostelId: userData.hostelId?.toString?.(), 
      hostelStatus: userData.hostelStatus 
    });

    const hostelIdValue = session.hostelId || userData.hostelId?.toString?.() || userData.hostelId || null;

    if (hostelIdValue && isValidObjectId(hostelIdValue)) {
      activeHostelData = await Hostel.findById(hostelIdValue)
        .select('name address phone email capacity joinCode status autoApprove settings ownerId createdAt')
        .lean();
    } else if (hostelIdValue) {
      console.warn('Invalid session hostelId detected:', hostelIdValue);
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        _id: userData._id?.toString?.() || session.userId,
        id: userData._id?.toString?.() || session.userId,
        name: userData.name || userData.hostelName,
        email: userData.email || null,
        role: session.role,
        hostelId: activeHostelData?._id?.toString?.() || (isValidObjectId(hostelIdValue) ? hostelIdValue : null),
        hostelData: activeHostelData
          ? {
              ...activeHostelData,
              _id: activeHostelData._id.toString(),
              id: activeHostelData._id.toString(),
              hostelName: activeHostelData.name,
            }
          : null,
        profileImage: userData.profileImage || null,
        status: userData.status || null,
        hostelStatus: userData.hostelStatus || null,
        // Full profile fields so refreshUser() correctly restores all form data
        phone: userData.phone || null,
        address: userData.address || null,
        emergencyContact: userData.emergencyContact || null,
        guardianName: userData.guardianName || null,
        collegeName: userData.collegeName || null,
        course: userData.course || null,
        year: userData.year || null,
        duration: userData.duration || null,
        enrollmentId: userData.enrollmentId || null,
        roomId: userData.roomId?.toString?.() || null,
        rentAmount: userData.rentAmount || null,
        joiningDate: userData.joiningDate || null,
        arrivalDate: userData.arrivalDate || null,
        termEndDate: userData.termEndDate || null,
        daysLeft: userData.daysLeft ?? null,
        balance: userData.balance ?? null,
        idProof: userData.idProof || null,
        createdAt: userData.createdAt || null,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

/**
 * DELETE: Standard Logout
 */
export async function DELETE() {
  await clearAuthCookie();
  return NextResponse.json({ success: true, message: 'Logged out' });
}
