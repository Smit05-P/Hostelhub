import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Hostel from '@/models/Hostel';
import { hashPassword, signSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const body = await req.json();
    const { hostelName, ownerName, email, phone, address, password } = body;

    if (!hostelName || !ownerName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    
    // Check if email already exists
    const existing = await Hostel.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create the document
    const hostel = await Hostel.create({
      name: hostelName,
      ownerName,
      email,
      phone: phone || '',
      address: address || '',
      passwordHash,
      plan: 'free',
      status: 'Active',
    });

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
      message: 'Hostel account created successfully',
      hostelId: hostel._id.toString()
    }, { status: 201 });

  } catch (error) {
    console.error('Hostel Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
