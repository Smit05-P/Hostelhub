import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Student from '@/models/Student';
import Hostel from '@/models/Hostel';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { name, email, password, role, hostelName, address, phone } = body;

    // 1. Validate inputs
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' }, 
        { status: 400 }
      );
    }

    // 2. MongoDB connection
    await dbConnect();

    // 3. Duplicate user check
    const lowerEmail = email.toLowerCase();
    const existingAdmin = await Admin.findOne({ email: lowerEmail });
    const existingStudent = await Student.findOne({ email: lowerEmail });
    
    if (existingAdmin || existingStudent) {
      return NextResponse.json(
        { error: 'User with this email already exists' }, 
        { status: 409 }
      );
    }

    let user = null;
    let hostelId = null;

    if (role === 'admin') {
      // Create the Hostel first
      const newHostel = await Hostel.create({
        name: hostelName || `${name}'s Hostel`,
        address: address || 'Not specified',
        phone: phone || '',
        ownerId: 'placeholder', 
      });

      // Create Admin - Mongoose pre-save hook handles bcrypt hashing
      user = await Admin.create({
        name,
        email: lowerEmail,
        password, 
        role: 'admin',
        hostelId: newHostel._id,
      });

      // Update Hostel ownerId
      newHostel.ownerId = user._id.toString();
      await newHostel.save();
      
      hostelId = newHostel._id;
    } else {
      // Create Student - Mongoose pre-save hook handles bcrypt hashing on passwordHash
      user = await Student.create({
        name,
        email: lowerEmail,
        passwordHash: password,
        role: 'student',
        phone: phone || '',
        status: 'Active',
        hostelStatus: 'NO_HOSTEL'
      });
    }

    // Generate session token (JWT)
    const token = signToken({ 
      userId: user._id.toString(), 
      email: user.email, 
      role: role,
      hostelId: hostelId?.toString()
    });

    // Set cookie using the central auth util
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        hostelId: hostelId,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error [POST /api/auth/register]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
