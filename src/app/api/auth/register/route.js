import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Student from '@/models/Student';
import Hostel from '@/models/Hostel';
import { signToken, setAuthCookie } from '@/lib/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { name, email, password, role, hostelName, address, phone } = body || {};

    // 1. Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' }, 
        { status: 400 }
      );
    }

    // 2. Validate email format
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' }, 
        { status: 400 }
      );
    }

    // 3. Validate password strength
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' }, 
        { status: 400 }
      );
    }

    // 4. Validate role
    if (role !== 'admin' && role !== 'student') {
      return NextResponse.json(
        { error: 'Role must be either "admin" or "student"' }, 
        { status: 400 }
      );
    }

    // 5. Connect to MongoDB with error handling
    try {
      await dbConnect();
    } catch (dbErr) {
      console.error('[Registration DB Error]:', dbErr.message);
      return NextResponse.json(
        { error: 'Database connection failed. Please ensure MongoDB is reachable.' }, 
        { status: 503 }
      );
    }

    // 6. Duplicate user check across both Admin and Student
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });
    const existingStudent = await Student.findOne({ email: normalizedEmail });
    
    if (existingAdmin || existingStudent) {
      return NextResponse.json(
        { error: 'An account with this email already exists' }, 
        { status: 409 }
      );
    }

    let user = null;
    let hostelId = null;

    if (role === 'admin') {
      // Create the Hostel first
      const newHostel = await Hostel.create({
        name: hostelName?.trim() || `${name.trim()}'s Hostel`,
        address: address?.trim() || 'Not specified',
        phone: phone?.trim() || '',
        ownerId: 'placeholder', 
      });

      // Create Admin - Mongoose pre-save hook handles bcrypt hashing
      user = await Admin.create({
        name: name.trim(),
        email: normalizedEmail,
        password, 
        role: 'admin',
        hostelId: newHostel._id,
        authProvider: 'email',
        status: 'active',
      });

      // Update Hostel ownerId with the created Admin's _id
      newHostel.ownerId = user._id.toString();
      await newHostel.save();
      
      hostelId = newHostel._id;
    } else {
      // Create Student - Mongoose pre-save hook handles bcrypt hashing on passwordHash
      user = await Student.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: password,
        role: 'student',
        phone: phone?.trim() || '',
        authProvider: 'email',
        status: 'Active',
        hostelStatus: 'No-Hostel'
      });
    }

    // 7. Generate session token (JWT)
    const token = signToken({ 
      userId: user._id.toString(), 
      email: user.email, 
      role: role,
      hostelId: hostelId ? hostelId.toString() : null
    });

    // 8. Set secure HTTP-only cookie
    await setAuthCookie(token);

    // 9. Return safe response without password or hash
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: role,
        hostelId: hostelId ? hostelId.toString() : null,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error [POST /api/auth/register]:', error);

    // MongoDB duplicate key error code 11000
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An account with this email already exists' }, 
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
