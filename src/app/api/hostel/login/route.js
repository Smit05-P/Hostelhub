import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Hostel from '@/models/Hostel';
import { verifyPassword, signSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await dbConnect();

    const hostel = await Hostel.findOne({ email });

    if (!hostel) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, hostel.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (hostel.status !== 'active') {
      return NextResponse.json({ error: 'Your account is inactive. Please contact support.' }, { status: 403 });
    }

    // Generate session token
    const token = await signSession({ 
      userId: hostel._id.toString(), 
      email: hostel.email,
      role: 'admin',
      hostelId: hostel._id.toString()
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'hostel-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Logged in successfully',
      hostelId: hostel._id.toString()
    }, { status: 200 });

  } catch (error) {
    console.error('Hostel Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
